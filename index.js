const TelegramBot = require('node-telegram-bot-api');
const token = '5632609691:AAHJ6CvPeasSSrUHoGZePHEeLudoZv3sIR4';
const bot = new TelegramBot(token, { polling: true });
const { menu, reg, partners, ourcars, back, profile, editprofile } = require('./keyboards');
const sequelize = require('./db');
const Users = require("./models");
const express = require('express');
const fileUpload = require('express-fileupload');
const cors = require('cors');

const app = express();

app.use(fileUpload({
	createParentPath: true
}));

app.use(cors());

const port = process.env.PORT || 5000;

app.listen(port, () =>
	console.log(`App is listening on port ${port}.`)
);

app.post('/upload', async (req, res) => {
	try {
		if (!req.files) {
			res.send({
				status: false,
				message: 'No file uploaded'
			});
		} else {
			//Use the name of the input field (i.e. "avatar") to retrieve the uploaded file
			let avatar = req.files.avatar;

			//Use the mv() method to place the file in the upload directory (i.e. "uploads")
			avatar.mv('./uploads/' + avatar.name);

			//send response
			res.send({
				status: true,
				message: 'File is uploaded',
				data: {
					name: avatar.name,
					mimetype: avatar.mimetype,
					size: avatar.size
				}
			});
		}
	} catch (err) {
		res.status(500).send(err);
	}
});

const start = async () => {

	try {
		await sequelize.authenticate()
		await sequelize.sync()
		console.log('Connection has been established successfully.');
	} catch (e) {
		console.log('Подключение к бд сломалось', e);
	}

	bot.setMyCommands([
		{ command: '/info', description: 'О клубе' }
	])

	bot.on('message', async (msg) => {
		const text = msg.text;
		const chatId = msg.chat.id;
		try {
			if (text === '/start') {
				return bot.sendMessage(
					chatId,
					'Добро пожаловать, пожалуйста пройди регистрацию',
					req
				)
			}
			if (text === "/info") {
				return (
					bot.sendMessage(
						chatId,
						`Привет привееет!\nНа связи VW/SK CLUB 21 - крупнейшее автосообщество ваговодов Чувашии☝🏻\n\nМы - одна большая семья, которая держится друг за друга, делится своими радостями и неудачами, а все остальные переживают это, помогают в решении вопроса и поддерживают!\nВсе любят покрасоваться своими ласточками и мы не исключение💥\nВвиду этого у нас стабильно проходят автовстречи, где собирается вся наша дружная семья и обсуждает все события в большом кругу.\nА затем флаги в руки и в конвой.\nМы проезжаем по центральным улицам Чебоксар, чтобы показать нашу активность и дружность.\nНе забудем сказать и про партнеров, которых у нас немало. И этот список постоянно пополняется. От доставки еды до ремонта турбины - огромное количество сфер готовы предоставить клубную скидку для таких умничек и молодцов😂😂\n\nУ тебя нет ВАГа, но ты настоящий фанат немецкого автопрома? Не переживай и приходи на встречу🥰 Мы любим и уважаем каждого участника.\nДумаем, что стало немного понятнее.\nПоэтому чего ждать - добро пожаловать к нам в клуб!!!🎉🎊🎉🎊🎉`
					)
				)
			}
		} catch (error) {
			return bot.sendMessage(chatId, 'Произошла какая то ошибка!', menu)
		}

	})

}

start();