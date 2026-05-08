const fs = require('fs');
const http = require('http');
const { spawn } = require('child_process');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const port = 9223;
const profileDir = `${process.cwd()}\\.codex-run\\chrome-dashboard-profile`;
const screenshotPath = `${process.cwd()}\\.codex-run\\dashboard.png`;

const requestJson = (url, options = {}) => new Promise((resolve, reject) => {
  const req = http.request(url, options, (res) => {
    let body = '';
    res.on('data', (chunk) => {
      body += chunk;
    });
    res.on('end', () => {
      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(new Error(body || error.message));
      }
    });
  });
  req.on('error', reject);
  if (options.body) {
    req.write(options.body);
  }
  req.end();
});

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const waitForChrome = async () => {
  for (let index = 0; index < 40; index += 1) {
    try {
      return await requestJson(`http://127.0.0.1:${port}/json/version`);
    } catch (error) {
      await wait(250);
    }
  }
  throw new Error('Chrome remote debugging endpoint did not start.');
};

const cdp = async (webSocketDebuggerUrl) => {
  const socket = new WebSocket(webSocketDebuggerUrl);
  let id = 0;
  const pending = new Map();

  socket.addEventListener('message', (event) => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      const { resolve, reject } = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) {
        reject(new Error(message.error.message));
      } else {
        resolve(message.result);
      }
    }
  });

  await new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, { once: true });
    socket.addEventListener('error', reject, { once: true });
  });

  return {
    send(method, params = {}) {
      id += 1;
      socket.send(JSON.stringify({ id, method, params }));
      return new Promise((resolve, reject) => {
        pending.set(id, { resolve, reject });
      });
    },
    close() {
      socket.close();
    }
  };
};

(async () => {
  fs.rmSync(profileDir, { recursive: true, force: true });
  fs.mkdirSync(profileDir, { recursive: true });

  const loginBody = JSON.stringify({
    email: 'admin@school.com',
    password: 'Admin@123456'
  });

  const login = await requestJson('http://127.0.0.1:5000/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(loginBody)
    },
    body: loginBody
  });

  const chrome = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profileDir}`,
    '--window-size=1440,900',
    '--disable-gpu',
    'about:blank'
  ], {
    stdio: 'ignore'
  });

  try {
    await waitForChrome();
    const target = await requestJson(`http://127.0.0.1:${port}/json/new?http://127.0.0.1:3002/login`, { method: 'PUT' });
    const page = await cdp(target.webSocketDebuggerUrl);

    await page.send('Page.enable');
    await page.send('Runtime.enable');
    await page.send('Page.navigate', { url: 'http://127.0.0.1:3002/login' });
    await wait(1200);
    await page.send('Runtime.evaluate', {
      expression: `
        localStorage.setItem('token', ${JSON.stringify(login.token)});
        localStorage.setItem('userType', 'admin');
        localStorage.setItem('user', ${JSON.stringify(JSON.stringify(login.user))});
        location.href = '/dashboard';
      `
    });
    await wait(3500);

    const result = await page.send('Page.captureScreenshot', {
      format: 'png',
      captureBeyondViewport: false
    });
    fs.writeFileSync(screenshotPath, Buffer.from(result.data, 'base64'));
    page.close();
    console.log(screenshotPath);
  } finally {
    chrome.kill();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
