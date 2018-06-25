const utils = require('./utils.js')
const { VK } = require('vk-io');

const vk = new VK({
	token: process.env.TOKEN,
	pollingGroupId: 159219251
});

const { updates } = vk;

updates.hear(/^(bot|elise)\s(\w+)/i, async (context) => {
	await utils.heroParse(utils.heroVariations(context.$match[2]), 0, context);
});

async function run() {
	await utils.getHeroes();
	setInterval(async () => {
		await utils.getHeroes();
	}, 720000);

	await vk.updates.startPolling();
	console.log('Polling started');
}

run().catch(console.error);