import { WebSocketServer } from 'ws';

const toList = string => string.split(',').map(item => item.trim());
const animals = toList('Aardvark,Alligator,Alpaca,Anteater,Ape,Armadillo,Baboon,Badger,Barracuda,Bat,Beagle,Bear,Beaver,Beetle,Boar,Bobcat,Bonobo,Bullfrog,Bunny,Camel,Cat,Caterpillar,Cheetah,Cicada,Cougar,Coyote,Crab,Cricket,Crocodile,Dingo,Dog,Donkey,Dove,Dragon,Dragonfly,Duck,Eagle,Eel,Elephant,Fox,Gerbil,Giraffe,Goat,Hedgehog,Hornbill,Husky,Kangaroo,Koala,Leopard,Lion,Llama,Lobster,Mallard,Mink,Mongoose,Monkey,Mouse,Mule,Octupus,Owl,Pangolin,Panther,Parakeet,Pellican,Penguin,Platypus,Quail,Scorpion,Seahorse,Seal,Shark,Skunk,Sloth,Sparrow,Spider,Stork,Tuna,Turtle,Walrus,Warthog,Wasp,Whale,Wombat,Yak,Zebra');
const adjectives = toList('Adorable,Adventurous,Aggressive,Agreeable,Alert,Alive,Amused,Angry,Annoyed,Annoying,Anxious,Arrogant,Ashamed,Attractive,Average,Awful,Bad,Beautiful,Better,Bewildered,Black,Bloody,Blue,Blue-eyed,Blushing,Bored,Brainy,Brave,Breakable,Bright,Busy,Calm,Careful,Cautious,Charming,Cheerful,Clean,Clear,Clever,Cloudy,Clumsy,Colorful,Combative,Comfortable,Concerned,Condemned,Confused,Cooperative,Courageous,Crazy,Creepy,Crowded,Cruel,Curious,Cute,Dangerous,Dark,Dead,Defeated,Defiant,Delightful,Depressed,Determined,Different,Difficult,Disgusted,Distinct,Disturbed,Dizzy,Doubtful,Drab,Dull,Eager,Easy,Elated,Elegant,Embarrassed,Enchanting,Encouraging,Energetic,Enthusiastic,Envious,Evil,Excited,Expensive,Exuberant,Fair,Faithful,Famous,Fancy,Fantastic,Fierce,Filthy,Fine,Foolish,Fragile,Frail,Frantic,Friendly,Frightened,Funny,Gentle,Gifted,Glamorous,Gleaming,Glorious,Good,Gorgeous,Graceful,Grieving,Grotesque,Grumpy,Handsome,Happy,Healthy,Helpful,Helpless,Hilarious,Homeless,Homely,Horrible,Hungry,Hurt,Ill,Important,Impossible,Inexpensive,Innocent,Inquisitive,Itchy,Jealous,Jittery,Jolly,Joyous,Kind,Lazy,Light,Lively,Lonely,Long,Lovely,Lucky,Magnificent,Misty,Modern,Motionless,Muddy,Mushy,Mysterious,Nasty,Naughty,Nervous,Nice,Nutty,Obedient,Obnoxious,Odd,Old-fashioned,Open,Outrageous,Outstanding,Panicky,Perfect,Plain,Pleasant,Poised,Poor,Powerful,Precious,Prickly,Proud,Putrid,Puzzled,Quaint,Real,Relieved,Repulsive,Rich,Scary,Selfish,Shiny,Shy,Silly,Sleepy,Smiling,Smoggy,Sore,Sparkling,Splendid,Spotless,Stormy,Strange,Stupid,Successful,Super,Talented,Tame,Tasty,Tender,Tense,Terrible,Thankful,Thoughtful,Thoughtless,Tired,Tough,Troubled,Ugliest,Ugly,Uninterested,Unsightly,Unusual,Upset,Uptight,Vast,Victorious,Vivacious,Wandering,Weary,Wicked,Wide-eyed,Wild,Witty,Worried,Worrisome,Wrong,Zany,Zealous');
const random = list => list[Math.floor(Math.random() * list.length)];
const nick = () => [ random(adjectives), random(animals) ].join(' ');

const connections = new Set();

const { PORT = 80 } = process.env;
const [ port = PORT ] = process.argv.slice(2);

const wss = new WebSocketServer({ port });
wss.on(
	'connection',
	function(connection) {
		if (!connections.has(connection)) {
			connections.add(connection);
			connection.name = nick();
		}
		connection.on(
			'message',
			message => connection.send(
				JSON.stringify(
					react(
						connection,
						parse(message)
					)
				)
			)
		);
		connection.on(
			'close',
			() => {
				connections.has(connection) && connections.delete(connection);
				broadcast(connection, { action: 'leave', name: connection.name })
			}
		);
		connection.send(
			JSON.stringify({
				action: 'handshake',
				name: connection.name,
				success: true
			})
		);
	}
);

function react(connection, { action, message, name }) {
	switch(action) {
		case 'connect':
			broadcast(connection, { action: 'join', name: connection.name })
			return { action: 'feedback', name: action, success: true, message: 'Name set successfully' };
		case 'message':
			broadcast(connection, { action, message, name: connection.name });
			return { action: 'feedback', name: action, success: true, message: 'Message sent successfully' };
		default:
			return { action: 'feedback', name: action, success: false, message: `unsupported action (${action})` };
	}
}

function broadcast(connection, { action = 'message', message, name }) {
	connections.forEach(
		peer => peer !== connection && peer.send(
			JSON.stringify({ action, message, name })
		)
	)
};

function parse(message) {
	try {
		return JSON.parse(message);
	} catch (error) {
		return {};
	}
}
