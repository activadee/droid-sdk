import { z } from 'zod';
import { Droid } from '../src';

const CodeAnalysisSchema = z.object({
	summary: z.string(),
	languages: z.array(z.string()),
	frameworks: z.array(z.string()),
	issues: z.array(
		z.object({
			file: z.string(),
			line: z.number().optional(),
			severity: z.enum(['error', 'warning', 'info']),
			message: z.string(),
		}),
	),
	score: z.number().min(0).max(100),
});

type CodeAnalysis = z.infer<typeof CodeAnalysisSchema>;

async function main() {
	const droid = new Droid();
	const thread = droid.startThread();

	console.log('Analyzing codebase for issues...\n');

	const result = await thread.run(
		`Analyze this codebase and return a JSON object with:
    - summary: brief description of the project
    - languages: array of programming languages used
    - frameworks: array of frameworks detected
    - issues: array of objects with file, line (optional), severity (error/warning/info), message
    - score: quality score from 0-100
    
    Return ONLY the JSON object, no other text.`,
	);

	try {
		const analysis: CodeAnalysis = result.parse(CodeAnalysisSchema);

		console.log('=== Code Analysis Report ===\n');
		console.log('Summary:', analysis.summary);
		console.log('\nLanguages:', analysis.languages.join(', '));
		console.log('Frameworks:', analysis.frameworks.join(', '));
		console.log('Quality Score:', analysis.score, '/100');

		if (analysis.issues.length > 0) {
			console.log('\n--- Issues Found ---');
			for (const issue of analysis.issues) {
				const location = issue.line ? `${issue.file}:${issue.line}` : issue.file;
				console.log(`[${issue.severity.toUpperCase()}] ${location}`);
				console.log(`  ${issue.message}`);
			}
		} else {
			console.log('\nNo issues found!');
		}
	} catch (error) {
		console.error('Failed to parse response:', error);
		console.log('Raw response:', result.finalResponse);
	}
}

main().catch(console.error);
