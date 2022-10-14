const TelegramBot = require('node-telegram-bot-api');
const token = '5632609691:AAHJ6CvPeasSSrUHoGZePHEeLudoZv3sIR4';
const bot = new TelegramBot(token, { polling: true });
const { menu, reg, partners, ourcars, searchcar, profile, editprofile } = require('./keyboards');
const sequelize = require('./db');
const Users = require("./models");

const express = require('express');
const fileUpload = require('express-fileupload');
const cors = require('cors');
const fs = require('fs');
const uuid = require('uuid');
const path = require("path");


const app = express();

app.use(express.json());
app.use("/api/image", express.static("img"));

app.use(cors());

app.use(fileUpload({}));

const port = process.env.PORT || 5000;

app.listen(port, () =>
	console.log(`App is listening on port ${port}.`)
);

app.get('/api', async (req, res) => {
	return res.json('work');
})

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

		app.post('/api/upload', async (req, res) => {

			try {

				const { avatar } = req.files;

				const type = avatar.name.split('.').pop();

				let fileName = chatId + "." + type;

				try {
					avatar.mv(path.resolve(__dirname, "..", "bot-back/img/users_cars", fileName));
				} catch (error) {
					console.log(error);
				}
				// console.log(fileName);
				console.log(avatar);

				return res.json(fileName);
			} catch (err) {
				res.status(500).send(err);
			}
		})

		app.post("/api/upload/remove", (req, res) => {

			let { file } = req.body;
			console.log(file);

			if (file !== " ") {
				fs.access(
					path.resolve(__dirname, "..", "bot-back/img/users_cars", file),
					function (err, stats) {
						console.log(stats); //here we got all information of file in stats variable

						if (err) {
							return res.json("err");
						}

						fs.unlink(path.resolve(__dirname, "..", "bot-back/img/users_cars", file), function (err) {
							if (err) return console.log(err);
							console.log("file deleted successfully");
						});
					}
				);
			}
		})

		try {
			if (text === '/start') {
				return bot.sendMessage(
					chatId,
					'Добро пожаловать, пожалуйста пройди регистрацию',
					reg
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
			if (text === "Встречи") {
				await bot.sendPhoto(chatId, './img/event.jpeg');
				await bot.sendLocation(chatId, 56.135323, 47.242850);
				return (
					bot.sendMessage(
						chatId,
						`Дата: 16/10/2022\nВремя: 20:00\nМесто: ТЦ Карусель`,
						menu
					)
				)
			}
			if (text === "Партнеры") {
				return (
					bot.sendMessage(
						chatId,
						`Выбери партнера и получи скидку 👇`,
						partners
					)
				)
			}
			if (text === "Наши авто") {
				return (
					bot.sendMessage(
						chatId,
						`Фотографии автомобилей участников 👇`,
						ourcars
					)
				)
			}
			if (text === "Поиск авто") {
				return (
					bot.sendMessage(
						chatId,
						`Перейди, если хочешь найти авто по номеру 👇`,
						searchcar
					)
				)
			}
		} catch (error) {
			return bot.sendMessage(chatId, 'Произошла какая то ошибка!', menu)
		}

	})

}

start();