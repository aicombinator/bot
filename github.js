export async function login(bot, params){
	const github_username = await bot.get_param('github', 'username', params);
	const github_password = await bot.get_param('github', 'password', params);

	if(!github_username || !github_password) throw 'no credentials for github';

	const page = (await bot.browser.pages())[0];
	await page.goto('https://github.com/login');
	await bot.wait(2);

	if(page.url() == 'https://github.com/'){
		console.log('Redirected to home, checking account');
		let u = await page.$('summary[title="Switch account context"] > span');

		if(u && (await u.evaluate(el => el.textContent)).includes(github_username)){
			console.log(`Already logged-in to github as ${github_username}`);
			return;
		} else {
			let r = u && (await u.evaluate(el => el.textContent));
			console.log(`Different account: ${r}. Logging out and visiting login page`);
			page.goto('https://github.com/logout')
			let logout = await page.waitForSelector('input[value="Sign out"]');
			await logout.click();
			await bot.wait(2);
			await page.goto('https://github.com/login');
		}
	}

	await page.waitForSelector('input[autocomplete="username"]', { visible: true });
	console.log({github_username}, {github_password});
	await page.type('input[autocomplete="username"]', github_username, { delay: 100 });

	await page.type('input[name="password"]', github_password, { delay: 100 });

	const login = await page.waitForSelector('input[value="Sign in"]');
	await login.click();

	await page.waitForNavigation();

	// Fill 2FA OTP if asked
	if(await page.$('input[name="otp"]')){
		const otp = await bot.get_2fa_totp('github', {}, params);
		if(!otp) throw `2FA not set up`;

		await page.type('input[name="otp"]', otp, { delay: 100 });
	
		const verify = await page.waitForSelector('text/Verify');
		await verify.click();
		await page.waitForNavigation();
	}

	if(page.url() == 'https://github.com/'){
		console.log("logged-in to github");
		return;
	} else {
		throw `still at ${page.url()}`;
	}
}

export async function invite(bot, params){
	// await login(bot, params);
	const page = (await bot.browser.pages())[0];
	const repo_name = params.repo;
	const user = params.user;
	if(!repo_name || !user) throw 'Need user and repo for github.add_member';
	const github_username = await bot.get_param('github', 'username', params);
	if(!repo_name.includes('/')) repo_name = github_username + '/' + repo_name;
	await page.goto(`https://github.com/${repo_name}/settings/access`);
	await bot.wait(2);

	let hasPasswordPrompt = await page.evaluate(() => {
		return document.querySelector('body').innerText.includes('Confirm access')
	})

	if(hasPasswordPrompt){
		const github_password = await bot.get_param('github', 'password', params);
		await page.type('input[type="password"]', github_password, { delay: 100 });
		await (await page.waitForSelector('button[type="submit"]')).click();
		await bot.wait(2);
	}

	const add_people = await page.$('details[id="add-user-access-dialog"]');
	await add_people.click();
	await page.waitForSelector('input[name="member"]');
	await page.type('input[name="member"]', user, {delay: 100});

	await page.$$eval('ul[id="repo-add-access-search-results-user"] li', found => {
		console.log({found}, found.length);
		for(s in found){
			if(s.textContent.include(user) && s.textContent.include('Invite outside collaborator')){
				console.log("Found item");
				s.click();
				break;
			}
		}
	});

	const addButton = await page.waitForSelector(`text/Add ${user} to this repository`);
	await addButton.click();

	await bot.wait(5);
}

export default {
	login,
	invite
}