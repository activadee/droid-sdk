import type { SidebarsConfig } from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
	docsSidebar: [
		{
			type: 'category',
			label: 'Getting Started',
			items: ['introduction', 'quickstart', 'installation'],
		},
		{
			type: 'category',
			label: 'Core Concepts',
			items: [
				'concepts/droid',
				'concepts/threads',
				'concepts/streaming',
				'concepts/structured-output',
			],
		},
		{
			type: 'category',
			label: 'Guides',
			items: [
				'guides/multi-turn',
				'guides/file-attachments',
				'guides/error-handling',
				'guides/ci-cd',
			],
		},
	],
	apiSidebar: [
		'api-reference/overview',
		{
			type: 'category',
			label: 'Classes',
			items: [
				'api-reference/classes/droid',
				'api-reference/classes/thread',
				'api-reference/classes/turn-result',
			],
		},
		{
			type: 'category',
			label: 'Errors',
			items: [
				'api-reference/errors/droid-error',
				'api-reference/errors/cli-not-found-error',
				'api-reference/errors/execution-error',
				'api-reference/errors/parse-error',
				'api-reference/errors/timeout-error',
				'api-reference/errors/stream-error',
			],
		},
		{
			type: 'category',
			label: 'Types',
			items: [
				'api-reference/types/config',
				'api-reference/types/options',
				'api-reference/types/events',
				'api-reference/types/turn-items',
			],
		},
		{
			type: 'category',
			label: 'CLI',
			items: ['api-reference/cli/installer', 'api-reference/cli/process'],
		},
		{
			type: 'category',
			label: 'Models',
			items: ['api-reference/models/overview', 'api-reference/models/model-info'],
		},
	],
};

export default sidebars;
