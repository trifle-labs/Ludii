// @java Common/src/main/CommandLineArgParse.java

import { StringRoutines } from "./StringRoutines.js";

/**
 * Class for parsing of command line arguments.
 *
 * Functionality loosely based on the argparse module of Python 3.
 *
 * @java main.CommandLineArgParse
 * @author Dennis Soemers
 */
export class CommandLineArgParse {
  // -------------------------------------------------------------------------

  /**
   * Types of options we may have
   *
   * @java main.CommandLineArgParse.OptionTypes
   * @author Dennis Soemers
   */
  public static readonly OptionTypes = {
    /** Boolean option */
    Boolean: "Boolean",
    /** Int option */
    Int: "Int",
    /** Float option */
    Float: "Float",
    /** Double option */
    Double: "Double",
    /** String option */
    String: "String",
  } as const;

  // -------------------------------------------------------------------------

  /** Whether or not arguments are case sensitive. True by default */
  protected readonly caseSensitive: boolean;

  /** Description of the program for which we're parsing arguments */
  protected readonly description: string | null;

  /** Nameless options (values must be provided by user in fixed order) */
  protected readonly namelessOptions: CommandLineArgParse.ArgOption[] = [];

  /** Named options (these may be provided by user in any order) */
  protected readonly namedOptions: Map<string, CommandLineArgParse.ArgOption> = new Map();

  /** List of named options that are required (nameless options are always required) */
  protected readonly requiredNamedOptions: CommandLineArgParse.ArgOption[] = [];

  /** All options, precisely in the order in which they were provided. */
  protected readonly allOptions: CommandLineArgParse.ArgOption[] = [];

  /** List containing user-provided values for nameless args (populated by parseArguments() call) */
  protected readonly providedNamelessValues: unknown[] = [];

  /** Map containing all user-provided values (populated by parseArguments() call) */
  protected readonly providedValues: Map<string, unknown> = new Map();

  // -------------------------------------------------------------------------

  /**
   * Constructor
   * @java CommandLineArgParse()
   */
  public constructor();
  /**
   * Constructor
   * @java CommandLineArgParse(boolean)
   */
  public constructor(caseSensitive: boolean);
  /**
   * Constructor
   * @java CommandLineArgParse(boolean, String)
   */
  public constructor(caseSensitive: boolean, description: string | null);
  public constructor(caseSensitive = true, description: string | null = null) {
    this.caseSensitive = caseSensitive;
    this.description = description;
  }

  // -------------------------------------------------------------------------

  /**
   * Adds the given option
   * @java CommandLineArgParse.addOption(ArgOption)
   */
  public addOption(argOption: CommandLineArgParse.ArgOption): void {
    // some error checking
    if (argOption.names !== null) {
      for (let name of argOption.names) {
        if (!this.caseSensitive)
          name = name.toLowerCase();

        if (name === "-h" || name === "--help") {
          process.stderr.write(
            "Not adding option! Cannot use arg name: " + name +
            ". This is reserved for help message.\n"
          );
          return;
        }
      }
    } else {
      if (argOption.expectsList()) {
        process.stderr.write("Multi-valued nameless arguments are not currently supported!\n");
        return;
      }

      if (this.namedOptions.size > 0) {
        process.stderr.write("Adding nameless options after named options is not currently supported!\n");
        return;
      }
    }

    if (
      argOption.numValsStr !== null &&
      argOption.numValsStr !== "+" &&
      argOption.numValsStr !== "*"
    ) {
      process.stderr.write("Not adding option! Invalid numVals specified: " + argOption.numValsStr + "\n");
      return;
    }

    // try to automatically determine type if not specified
    if (argOption.type === null) {
      if (argOption.defaultVal !== null && argOption.defaultVal !== undefined) {
        if (typeof argOption.defaultVal === "boolean")
          argOption.type = CommandLineArgParse.OptionTypes.Boolean;
        else if (Number.isInteger(argOption.defaultVal) && typeof argOption.defaultVal === "number")
          argOption.type = CommandLineArgParse.OptionTypes.Int;
        else if (typeof argOption.defaultVal === "number")
          argOption.type = CommandLineArgParse.OptionTypes.Double;
        else
          argOption.type = CommandLineArgParse.OptionTypes.String;
      } else {
        if (argOption.expectsList()) {
          argOption.type = CommandLineArgParse.OptionTypes.String;
        } else if (argOption.numVals === 1) {
          argOption.type = CommandLineArgParse.OptionTypes.String;
        } else {
          argOption.type = CommandLineArgParse.OptionTypes.Boolean;
        }
      }
    }

    // only allow boolean args to have non-list 0 values
    if (
      argOption.type !== CommandLineArgParse.OptionTypes.Boolean &&
      argOption.numValsStr === null &&
      argOption.numVals === 0
    ) {
      process.stderr.write("Not adding option! Cannot accept 0 values for non-boolean option.\n");
      return;
    }

    // set a default value of false for booleans with no default set yet
    if (argOption.type === CommandLineArgParse.OptionTypes.Boolean && (argOption.defaultVal === null || argOption.defaultVal === undefined))
      argOption.defaultVal = false;

    // add option to all the relevant lists/maps
    this.allOptions.push(argOption);

    // make sure default value is legal
    if (argOption.defaultVal !== null && argOption.defaultVal !== undefined && argOption.legalVals !== null) {
      let found = false;

      for (const legalVal of argOption.legalVals) {
        if (legalVal === argOption.defaultVal) {
          found = true;
          break;
        }
      }

      if (!found) {
        process.stderr.write(
          "Error: default value " + argOption.defaultVal +
          " is not legal. Legal values = " + JSON.stringify(argOption.legalVals) + "\n"
        );
        return;
      }
    }

    if (argOption.names === null) {
      this.namelessOptions.push(argOption);
    } else {
      for (let name of argOption.names) {
        if (!this.caseSensitive)
          name = name.toLowerCase();

        if (this.namedOptions.has(name))
          process.stderr.write("Error: Duplicate name:" + name + "\n");

        this.namedOptions.set(name, argOption);
      }

      if (argOption.required)
        this.requiredNamedOptions.push(argOption);
    }
  }

  /**
   * Parses the given arguments.
   * @return True if arguments were parsed successfully, false otherwise.
   * @java CommandLineArgParse.parseArguments(String[])
   */
  public parseArguments(args: string[]): boolean {
    let currentToken: string | null = null;
    let nextNamelessOption = 0;
    let currentOption: CommandLineArgParse.ArgOption | null = null;
    let currentOptionName: string | null = null;
    let currentValues: unknown[] | null = null;

    try {
      for (let i = 0; i < args.length;) {
        currentToken = args[i]!;
        const token = this.caseSensitive ? currentToken : currentToken.toLowerCase();

        if (token === "-h" || token === "--help") {
          this.printHelp();
          return false;
        }

        if (nextNamelessOption < this.namelessOptions.length) {
          // we should be starting with a new nameless option
          if (!this.finishArgOption(currentOption, currentOptionName, currentValues))
            return false;

          if (this.namedOptions.has(token)) {
            process.stderr.write(
              "Error: found name \"" + currentToken! + "\" while expecting more nameless options.\n"
            );
            return false;
          }

          currentOption = this.namelessOptions[nextNamelessOption]!;
          currentOptionName = "NAMELESS_" + nextNamelessOption;
          currentValues = [];

          currentValues.push(CommandLineArgParse.tokenToVal(token, currentOption.type!));

          ++nextNamelessOption;
        } else if (this.namedOptions.has(token)) {
          // looks like we're starting with a new named option
          if (!this.finishArgOption(currentOption, currentOptionName, currentValues))
            return false;

          currentOption = this.namedOptions.get(token)!;
          currentOptionName = currentToken!;
          currentValues = [];
        } else {
          // add this token as a value
          currentValues!.push(CommandLineArgParse.tokenToVal(token, currentOption!.type!));
        }

        ++i;
      }

      // also make sure to finish handling the very last option
      if (!this.finishArgOption(currentOption, currentOptionName, currentValues))
        return false;
    } catch (e) {
      process.stderr.write("Parsing args failed on token \"" + currentToken + "\" with exception:\n");
      if (e instanceof Error) process.stderr.write(e.stack + "\n");
      process.stderr.write("\n");
      this.printHelp();
      process.stderr.write("\n");
      return false;
    }

    // let's make sure we have values for all the required options
    if (this.providedNamelessValues.length < this.namelessOptions.length) {
      process.stderr.write("Missing value for nameless option " + this.providedNamelessValues.length + "\n");
      return false;
    }

    for (const option of this.requiredNamedOptions) {
      const key = this.caseSensitive ? option.names![0]! : option.names![0]!.toLowerCase();

      if (!this.providedValues.has(key)) {
        process.stderr.write("Missing value for required option: " + option.names![0]! + "\n");
        return false;
      }
    }

    return true;
  }

  // -------------------------------------------------------------------------

  /**
   * @param i
   * @return The value for the i'th positional (nameless) argument
   * @java CommandLineArgParse.getValue(int)
   */
  public getValue(i: number): unknown;
  /**
   * @param name Name of the option for which to get value
   * @return The value for the argument with given name (may return default value)
   * @java CommandLineArgParse.getValue(String)
   */
  public getValue(name: string): unknown;
  public getValue(arg: number | string): unknown {
    if (typeof arg === "number") {
      return this.providedNamelessValues[arg];
    } else {
      let key = arg;
      if (!this.caseSensitive)
        key = key.toLowerCase();
      if (this.providedValues.has(key))
        return this.providedValues.get(key);
      return this.namedOptions.get(key)!.defaultVal;
    }
  }

  /** @java CommandLineArgParse.getValueBool(int) */
  public getValueBool(i: number): boolean;
  /** @java CommandLineArgParse.getValueBool(String) */
  public getValueBool(name: string): boolean;
  public getValueBool(arg: number | string): boolean {
    return this.getValue(arg as never) as boolean;
  }

  /** @java CommandLineArgParse.getValueInt(int) */
  public getValueInt(i: number): number;
  /** @java CommandLineArgParse.getValueInt(String) */
  public getValueInt(name: string): number;
  public getValueInt(arg: number | string): number {
    return this.getValue(arg as never) as number;
  }

  /** @java CommandLineArgParse.getValueFloat(int) */
  public getValueFloat(i: number): number;
  /** @java CommandLineArgParse.getValueFloat(String) */
  public getValueFloat(name: string): number;
  public getValueFloat(arg: number | string): number {
    return this.getValue(arg as never) as number;
  }

  /** @java CommandLineArgParse.getValueDouble(int) */
  public getValueDouble(i: number): number;
  /** @java CommandLineArgParse.getValueDouble(String) */
  public getValueDouble(name: string): number;
  public getValueDouble(arg: number | string): number {
    return this.getValue(arg as never) as number;
  }

  /** @java CommandLineArgParse.getValueString(int) */
  public getValueString(i: number): string;
  /** @java CommandLineArgParse.getValueString(String) */
  public getValueString(name: string): string;
  public getValueString(arg: number | string): string {
    return this.getValue(arg as never) as string;
  }

  // -------------------------------------------------------------------------

  /**
   * Print help message
   * @java CommandLineArgParse.printHelp(PrintStream)
   */
  public printHelp(): void {
    const out = (s: string) => process.stdout.write(s);

    if (this.description !== null)
      out(this.description);
    else
      out("No program description.");

    out("\n\n");

    if (this.namelessOptions.length > 0) {
      out("Positional arguments:\n");
      for (const option of this.namelessOptions) {
        CommandLineArgParse.printOptionLine(option);
      }
      out("\n");
    }

    out("Required named arguments:\n");
    for (let i = 0; i < this.allOptions.length; ++i) {
      const option = this.allOptions[i]!;
      if (option.names !== null) {
        if (option.required) {
          CommandLineArgParse.printOptionLine(option);
        }
      }
    }

    out("\n");

    out("Optional named arguments:\n");
    out(" -h, --help                                                      Show this help message.\n");

    for (let i = 0; i < this.allOptions.length; ++i) {
      const option = this.allOptions[i]!;
      if (option.names !== null) {
        if (!option.required) {
          CommandLineArgParse.printOptionLine(option);
        }
      }
    }
  }

  /**
   * Prints a help line for the given option
   * @java CommandLineArgParse.printOptionLine(ArgOption, PrintStream)
   */
  private static printOptionLine(option: CommandLineArgParse.ArgOption): void {
    let sb = "";

    if (option.names === null) {
      if (option.legalVals !== null) {
        sb += " {";
        for (let i = 0; i < option.legalVals.length; ++i) {
          if (i > 0)
            sb += ",";
          sb += option.legalVals[i];
        }
        sb += "}";
      } else {
        sb += " " + option.type!.toUpperCase();
      }
    } else {
      sb += " ";

      for (let i = 0; i < option.names.length; ++i) {
        sb += option.names[i];
        if (i + 1 < option.names.length)
          sb += ", ";
      }

      let metaVar = option.names[0]!.toUpperCase();
      while (metaVar.startsWith("-")) {
        metaVar = metaVar.substring(1);
      }
      metaVar = metaVar.replace(/-/g, "_");

      if (option.numValsStr === null) {
        if (option.numVals > 0) {
          if (option.numVals === 1) {
            sb += " " + metaVar;
          } else {
            for (let i = 1; i <= option.numVals; ++i) {
              sb += " " + metaVar + "_" + i;
            }
          }
        }
      } else if (option.numValsStr === "+") {
        sb += " " + metaVar + "_1";
        sb += " [ " + metaVar + "_* ... ]";
      } else if (option.numValsStr === "*") {
        sb += " [ " + metaVar + "_* ... ]";
      }
    }

    if (sb.length >= 65) {
      sb += "\t";
    } else {
      while (sb.length < 65) {
        sb += " ";
      }
    }

    sb += option.helpText;

    process.stdout.write(sb + "\n");
  }

  // -------------------------------------------------------------------------

  /**
   * Finish handling the arg option we're currently processing
   * @java CommandLineArgParse.finishArgOption(ArgOption, String, List<Object>)
   */
  private finishArgOption(
    currentOption: CommandLineArgParse.ArgOption | null,
    currentOptionName: string | null,
    currentValues: unknown[] | null
  ): boolean {
    if (currentOption !== null) {
      // first check if our current option has as many values as it needs
      if (currentOption.numValsStr === null) {
        if (currentValues!.length !== currentOption.numVals) {
          process.stderr.write(
            "Error: " + currentOptionName + " requires " + currentOption.numVals +
            " values, but received " + currentValues!.length + " values.\n"
          );
          return false;
        }
      } else if (currentOption.numValsStr === "+") {
        if (currentValues!.length === 0) {
          process.stderr.write(
            "Error: " + currentOptionName + " requires more than 0" +
            " values, but only received 0 values.\n"
          );
          return false;
        }
      }

      // make sure all provided values are legal
      if (currentOption.legalVals !== null) {
        for (const val of currentValues!) {
          let found = false;

          for (const legalVal of currentOption.legalVals) {
            if (val === legalVal) {
              found = true;
              break;
            }
          }

          if (!found) {
            process.stderr.write(
              "Error: " + val + " is an illegal value." +
              " Legal values = " + JSON.stringify(currentOption.legalVals) + "\n"
            );
            return false;
          }
        }
      }

      if (currentOption.names === null) {
        if (currentOption.expectsList()) {
          this.providedNamelessValues.push(currentValues);
        } else if (currentValues!.length === 0 && currentOption.type === CommandLineArgParse.OptionTypes.Boolean) {
          this.providedNamelessValues.push(true);
        } else {
          this.providedNamelessValues.push(currentValues![0]);
        }
      } else {
        for (let name of currentOption.names) {
          if (!this.caseSensitive)
            name = name.toLowerCase();

          if (currentOption.expectsList()) {
            this.providedValues.set(name, currentValues);
          } else if (currentValues!.length === 0 && currentOption.type === CommandLineArgParse.OptionTypes.Boolean) {
            this.providedValues.set(name, true);
          } else {
            this.providedValues.set(name, currentValues![0]);
          }
        }
      }
    }

    return true;
  }

  /** @java CommandLineArgParse.tokenToVal(String, OptionTypes) */
  private static tokenToVal(token: string, type: string): unknown {
    if (type === CommandLineArgParse.OptionTypes.Boolean)
      return token === "true";
    else if (type === CommandLineArgParse.OptionTypes.Double)
      return parseFloat(token);
    else if (type === CommandLineArgParse.OptionTypes.Float)
      return parseFloat(token);
    else if (type === CommandLineArgParse.OptionTypes.Int)
      return parseInt(token, 10);
    else
      return token;
  }
}

// -------------------------------------------------------------------------

export namespace CommandLineArgParse {
  /**
   * Class for options that we may have.
   *
   * @java main.CommandLineArgParse.ArgOption
   * @author Dennis Soemers
   */
  export class ArgOption {
    // -----------------------------------------------------------------------

    /** List of names/flags for this option */
    public names: string[] | null = null;

    /**
     * Option type.
     * If the type is not specified, we will try to intelligently determine
     * the type based on any specified default values.
     */
    public type: string | null = null;

    /** Expected number of values we expect to be supplied */
    public numVals: number = 0;

    /**
     * String description of expected number of values. Can be:
     * - null, meaning we just look at the numVals int
     * - "*", meaning we allow any number >= 0
     * - "+", meaning we allow any number > 0
     */
    public numValsStr: string | null = null;

    /**
     * Default value to be returned if no value supplied.
     */
    public defaultVal: unknown = null;

    /**
     * If true, the parser will fail if no value is provided by the user.
     */
    public required: boolean = false;

    /** If not null, only objects in this array will be legal */
    public legalVals: unknown[] | null = null;

    /** Description for this option in help message @java ArgOption.help */
    public helpText: string = "";

    // -----------------------------------------------------------------------

    /**
     * Constructor
     * @java CommandLineArgParse.ArgOption()
     */
    public constructor() {
      // do nothing
    }

    // -----------------------------------------------------------------------

    /**
     * Set names/flags that can be used for this arg option
     * @java CommandLineArgParse.ArgOption.withNames(String...)
     */
    public withNames(...optionNames: string[]): this {
      this.names = optionNames;
      return this;
    }

    /**
     * Set type for this arg option
     * @java CommandLineArgParse.ArgOption.withType(OptionTypes)
     */
    public withType(optionType: string): this {
      this.type = optionType;
      return this;
    }

    /**
     * Set the expected number of values for this arg option
     * @java CommandLineArgParse.ArgOption.withNumVals(int)
     */
    public withNumVals(optionNumVals: number): this;
    /**
     * Set the expected number of values for this arg option
     * @java CommandLineArgParse.ArgOption.withNumVals(String)
     */
    public withNumVals(optionNumValsStr: string): this;
    public withNumVals(val: number | string): this {
      if (typeof val === "string") {
        if (StringRoutines.isInteger(val))
          return this.withNumVals(parseInt(val, 10));
        this.numValsStr = val;
        return this;
      }
      this.numVals = val;
      return this;
    }

    /**
     * Set the default value for this arg option
     * @java CommandLineArgParse.ArgOption.withDefault(Object)
     */
    public withDefault(optionDefaultVal: unknown): this {
      this.defaultVal = optionDefaultVal;
      return this;
    }

    /**
     * Mark this arg option as required
     * @java CommandLineArgParse.ArgOption.setRequired()
     */
    public setRequired(): this;
    /**
     * Set whether this arg option is required
     * @java CommandLineArgParse.ArgOption.setRequired(boolean)
     */
    public setRequired(required: boolean): this;
    public setRequired(required = true): this {
      this.required = required;
      return this;
    }

    /**
     * Set restricted list of legal values
     * @java CommandLineArgParse.ArgOption.withLegalVals(Object...)
     */
    public withLegalVals(...optionLegalVals: unknown[]): this {
      this.legalVals = optionLegalVals;
      return this;
    }

    /**
     * Set the description for help message of this arg option
     * @java CommandLineArgParse.ArgOption.help(String)
     */
    public help(optionHelp: string): this {
      this.helpText = optionHelp;
      return this;
    }

    // -----------------------------------------------------------------------

    /**
     * @return Whether we expect a list of values (rather than a single value)
     * @java CommandLineArgParse.ArgOption.expectsList()
     */
    public expectsList(): boolean {
      if (this.numValsStr !== null)
        return true;
      return (this.numVals > 1);
    }

    // -----------------------------------------------------------------------

    /** @java CommandLineArgParse.ArgOption.toString() */
    public toString(): string {
      let sb = "[ArgOption: ";

      if (this.names !== null) {
        for (let i = 0; i < this.names.length; ++i) {
          sb += this.names[i];
          if (i + 1 < this.names.length)
            sb += ", ";
        }
      }

      sb += " type=" + this.type;

      if (this.numValsStr !== null)
        sb += " numVals=" + this.numValsStr;
      else
        sb += " numVals=" + this.numVals;

      if (this.defaultVal !== null && this.defaultVal !== undefined)
        sb += " default=" + this.defaultVal;

      if (this.required)
        sb += " required";

      if (this.legalVals !== null) {
        sb += " legalVals=" + JSON.stringify(this.legalVals);
      }

      if (this.helpText.length > 0)
        sb += "\t\t" + this.helpText;

      sb += "]";
      return sb;
    }

    // -----------------------------------------------------------------------
  }
}
