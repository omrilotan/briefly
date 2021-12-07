const service = window.location.protocol === 'https:'
	? `wss://${document.domain}`
	: `ws://localhost:8008`
;

let connection;
let div;

export default function start() {
	div = document.querySelector('div');
	connect();
	const forms = document.querySelectorAll('form');
	[...forms].forEach(
		form => form.addEventListener(
			'submit',
			function (event) {
				event.preventDefault();
				const action = form.getAttribute('name');
				const data = Object.fromEntries(
					[...event.target].map(
						({ name, value }) => [ name, value ]
					)
				);

				const message = form.querySelector('input[name="message"]');
				if (message) {
					appendMessage({ name: 'Me', message: message.value });
					message.value = '';
				}
				actions[action](data);
			},
			{ once: false }
		)
	);

	if (Notification.permission !== 'granted') {
		Notification.requestPermission()
			.then(permission => permission === 'granted' && new Notification('Thanks'))
			.catch(() => null);
	}
}

const actions = { message };

function connect() {
	connection = new WebSocket(service);
	connection.onopen = () => connection.send(
		JSON.stringify({ action: 'connect' })
	);

	connection.onmessage = function ({ data }) {
		const {
			action,
			success,
			message,
			name
		} = JSON.parse(data);

		switch (action) {
			case 'handshake':
				const text = document.createTextNode('You are: ');
				const b = document.createElement('b');
				b.innerText = name;
				const fragment = document.createDocumentFragment();
				fragment.appendChild(text);
				fragment.appendChild(b);
				document.querySelector('h1').appendChild(fragment);
				break;
			case 'message':
				appendMessage({ name, message });
				break;
			case 'leave':
				appendMessage({ message: `${name} has left` });
				break;
			case 'join':
				appendMessage({ message: `${name} has joined` });
				break;
			case 'feedback':
				console.log({ name, success, message });
				break;
			default:
				console.log('unknown action', message);
		}
	}
	connection.onerror = function (error) {
		throw error;
	}
}

function appendMessage({ name, message }) {
	const p = document.createElement('p');
	if (name) {
		const b = document.createElement('b');
		b.innerText = name;
		p.appendChild(b);
	}
	const text = document.createTextNode(message);
	p.appendChild(text);
	div.appendChild(p);
	div.style.paddingTop = 0;
	if (div.scrollHeight > div.offsetHeight) {
		div.scrollTo(0, div.scrollHeight);
	} else {
		const diff = [...div.children].map(
			({ offsetHeight }) => offsetHeight
		).reduce(
			(a, b) => a + b + 1,
			parseInt(getComputedStyle(div).paddingBottom) || 0
		);
		div.style.paddingTop = [
			div.offsetHeight - diff,
			'px'
		].join('');
	}

	if (name) {
		if (Notification.permission === 'granted') {
			if (!document.hasFocus()) {
				const notification = new Notification([name, message].join(': '));
			}
		}
	}
}

function message({ message }) {
	connection?.send(JSON.stringify({ action: 'message', message, name }));
}
