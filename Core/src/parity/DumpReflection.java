package parity;

import java.io.FileWriter;
import java.io.PrintWriter;
import java.lang.annotation.Annotation;
import java.lang.reflect.Constructor;
import java.lang.reflect.Method;
import java.lang.reflect.Modifier;
import java.lang.reflect.Parameter;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

import grammar.Grammar;
import main.grammar.Symbol;

/**
 * Dumps the reflection metadata that Java's compiler.ArgClass actually uses to
 * compile a .lud: for every grammar Symbol, the Java class it maps to, the
 * class's assignable supertypes (for ArgClass's expected.isAssignableFrom(cls)
 * filtering), and each constructor / static construct() method's parameter
 * types + @Opt/@Name/@Or/@Or2/@And annotations.
 *
 * This is the faithful counterpart to the EBNF grammar dump: it is captured
 * FROM Java's reflection, not hand-written, and lets the TS port reproduce
 * ArgClass.compile()'s algorithm exactly (type-based constructor matching)
 * instead of approximating it with grammar-symbol-name matching.
 *
 * Run: java -cp <bins:libs> parity.DumpReflection <out.json>
 */
public class DumpReflection
{
	public static void main(final String[] args) throws Exception
	{
		final String out = args.length > 0 ? args[0] : "ludeme-reflection.json";
		final Grammar grammar = Grammar.grammar();
		final List<Symbol> symbols = grammar.symbols();

		final StringBuilder sb = new StringBuilder();
		sb.append("{\n");
		boolean firstSym = true;
		final Set<String> doneClasses = new LinkedHashSet<>();

		for (final Symbol symbol : symbols)
		{
			final Class<?> cls = symbol.cls();
			if (cls == null)
				continue;
			final String className = cls.getName();
			// One entry per class (symbols can share a class); keep it keyed by class.
			if (!doneClasses.add(className))
				continue;

			if (!firstSym) sb.append(",\n");
			firstSym = false;
			sb.append("  ").append(quote(className)).append(": {\n");
			sb.append("    \"token\": ").append(quote(symbol.token())).append(",\n");
			sb.append("    \"label\": ").append(quote(symbol.grammarLabel())).append(",\n");

			// Assignable supertypes (climb superclasses + all interfaces).
			sb.append("    \"assignableTo\": [");
			final Set<String> supers = new LinkedHashSet<>();
			collectSupertypes(cls, supers);
			boolean fs = true;
			for (final String s : supers) { if (!fs) sb.append(", "); fs = false; sb.append(quote(s)); }
			sb.append("],\n");

			// Constructors + static construct() methods (the executables ArgClass tries).
			sb.append("    \"executables\": [\n");
			final List<String> execs = new ArrayList<>();
			for (final Constructor<?> c : cls.getDeclaredConstructors())
				execs.add(dumpExecutable("constructor", c.getParameters()));
			for (final Method m : cls.getDeclaredMethods())
				if (Modifier.isStatic(m.getModifiers()) && m.getName().equals("construct"))
					execs.add(dumpExecutable("construct", m.getParameters()));
			for (int i = 0; i < execs.size(); i++)
				sb.append("      ").append(execs.get(i)).append(i < execs.size() - 1 ? ",\n" : "\n");
			sb.append("    ]\n");
			sb.append("  }");
		}
		sb.append("\n}\n");

		try (final PrintWriter w = new PrintWriter(new FileWriter(out)))
		{
			w.print(sb.toString());
		}
		System.out.println("Dumped " + doneClasses.size() + " ludeme classes to " + out);
	}

	private static String dumpExecutable(final String kind, final Parameter[] params)
	{
		final StringBuilder sb = new StringBuilder();
		sb.append("{ \"kind\": ").append(quote(kind)).append(", \"params\": [");
		for (int i = 0; i < params.length; i++)
		{
			final Parameter p = params[i];
			if (i > 0) sb.append(", ");
			sb.append("{ \"name\": ").append(quote(p.getName())).append(", \"type\": ").append(quote(p.getType().getName()));
			sb.append(", \"array\": ").append(p.getType().isArray());
			final Set<String> anns = new LinkedHashSet<>();
			for (final Annotation a : p.getAnnotations())
				anns.add(a.annotationType().getSimpleName());
			sb.append(", \"ann\": [");
			boolean fa = true;
			for (final String a : anns) { if (!fa) sb.append(", "); fa = false; sb.append(quote(a)); }
			sb.append("] }");
		}
		sb.append("] }");
		return sb.toString();
	}

	private static void collectSupertypes(final Class<?> cls, final Set<String> out)
	{
		if (cls == null || cls == Object.class)
			return;
		out.add(cls.getName());
		for (final Class<?> i : cls.getInterfaces())
			collectSupertypes(i, out);
		collectSupertypes(cls.getSuperclass(), out);
	}

	private static String quote(final String s)
	{
		if (s == null) return "null";
		final StringBuilder sb = new StringBuilder("\"");
		for (int i = 0; i < s.length(); i++)
		{
			final char c = s.charAt(i);
			if (c == '"' || c == '\\') sb.append('\\').append(c);
			else if (c == '\n') sb.append("\\n");
			else sb.append(c);
		}
		return sb.append("\"").toString();
	}
}
