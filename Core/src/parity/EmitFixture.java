package parity;

import java.io.File;
import java.io.FileWriter;
import java.io.PrintWriter;
import java.util.List;

import org.apache.commons.rng.core.RandomProviderDefaultState;
import org.apache.commons.rng.core.source64.SplitMix64;

import game.Game;
import other.GameLoader;
import other.context.Context;
import other.move.Move;
import other.trial.Trial;

/**
 * Deterministic playout fixture emitter for parity testing.
 *
 * Usage: java parity.EmitFixture <ludPath> <rngStateCsv-8bytes> <outPath>
 *
 * The rngStateCsv is 8 comma-separated byte values (signed or unsigned 0-255).
 * These 8 bytes are the raw serialized state of the SplitMix64 RNG.
 */
public class EmitFixture
{
	public static void main(final String[] args) throws Exception
	{
		if (args.length < 3)
		{
			System.err.println("Usage: EmitFixture <ludPath> <rngStateCsv> <outPath>");
			System.exit(1);
		}

		final String ludPath = args[0];
		final String rngCsv  = args[1];
		final String outPath = args[2];

		// Parse the 8 RNG seed bytes
		final String[] parts = rngCsv.split(",");
		if (parts.length != 8)
		{
			System.err.println("rngStateCsv must have exactly 8 comma-separated bytes, got: " + parts.length);
			System.exit(1);
		}
		final byte[] rngBytes = new byte[8];
		for (int i = 0; i < 8; i++)
			rngBytes[i] = (byte) Integer.parseInt(parts[i].trim());

		// Load game
		final Game game = GameLoader.loadGameFromFile(new File(ludPath));
		game.disableMemorylessPlayouts();

		// First pass: run the playout to record all moves
		final SplitMix64 rng1 = new SplitMix64();
		rng1.restoreState(new RandomProviderDefaultState(rngBytes));

		final Trial trial1 = new Trial(game);
		final Context context1 = new Context(game, trial1);
		context1.rng().restoreState(new RandomProviderDefaultState(rngBytes));
		game.start(context1);

		game.playout(context1, null, 1.0, null, 0, -1, new java.util.Random(0L));

		// Collect the full moves list (includes init placement moves)
		final List<Move> allMoves = trial1.generateCompleteMovesList();

		// Second pass: replay to capture hashes at each ply
		final SplitMix64 rng2 = new SplitMix64();
		rng2.restoreState(new RandomProviderDefaultState(rngBytes));

		final Trial trial2 = new Trial(game);
		final Context context2 = new Context(game, trial2);
		context2.rng().restoreState(new RandomProviderDefaultState(rngBytes));
		game.start(context2);

		// Figure out how many setup/init moves were played before decision moves
		final int numInitMoves = trial2.numInitialPlacementMoves();

		try (final PrintWriter pw = new PrintWriter(new FileWriter(outPath)))
		{
			pw.println("game=" + game.name());
			pw.println("lud=" + ludPath);
			pw.println("rng=" + rngCsv);
			pw.println("total_moves=" + (allMoves.size() - numInitMoves));
			pw.println();

			int ply = 0;
			for (int i = numInitMoves; i < allMoves.size(); i++)
			{
				final Move m = allMoves.get(i);
				pw.println("ply=" + ply + " move=" + m.toTrialFormat(null));
				game.apply(context2, m);
				final long hash = context2.state().fullHash(context2);
				pw.println("ply=" + ply + " hash=" + hash);
				ply++;
			}

			pw.println();
			// Winners
			final StringBuilder winSB = new StringBuilder();
			for (int i = 0; i < context2.winners().size(); i++)
			{
				if (i > 0) winSB.append(",");
				winSB.append(context2.winners().get(i));
			}
			pw.println("winners=" + winSB);

			// Rankings
			final double[] rankings = trial2.ranking();
			final StringBuilder rankSB = new StringBuilder();
			for (int i = 1; i < rankings.length; i++)
			{
				if (i > 1) rankSB.append(",");
				rankSB.append(rankings[i]);
			}
			pw.println("rankings=" + rankSB);
		}

		System.out.println("Fixture written to: " + outPath);
	}
}
