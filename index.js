require('dotenv').config();

const TelegramBot = require('node-telegram-bot-api');

const token = process.env.TOKEN;
process.env["NTBA_FIX_350"] = 1;

const bot = new TelegramBot(token, { polling: true });
const { menu, reg, partners, ourcars, searchcar, profile } = require('./keyboards');
const sequelize = require('./db');
const Users = require("./models");

const express = require('express');
const fileUpload = require('express-fileupload');
const cors = require('cors');
const { access, unlink, readdir } = require('fs');
const { v4: uuidv4 } = require('uuid');
const mv = require('mv');
const path = require("path");
const { json } = require('body-parser');
const e = require('express');



const app = express();

app.use(express.json());

app.use("/api/image", express.static("img/users_cars"));
app.use("/api/icons", express.static("img/icons"));


app.use(cors());

app.use(fileUpload({}));

const port = process.env.PORT;

app.listen(port, () =>
	console.log(`App is listening on port ${port}.`)
);


app.get('/api', async (req, res) => {
	return res.json('work');
})

app.post('/api/searchcar', async (req, res) => {
	try {
		const searchName = req.body.searcheble;
		if (searchName != '') {
			let searchCarNum = await Users.findOne({ where: { carGRZ: searchName } });
			return res.json(searchCarNum);
		} else {
			return res.json('Не найдено');
		}
	} catch (e) {
		res.status(500).send(e);
	}
})

function shuffleArray(array) {
	for (let i = array.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[array[i], array[j]] = [array[j], array[i]];
	}
}

app.get('/api/ourcars', async (req, res) => {
	try {
		readdir(path.resolve(__dirname, "..", "bot-back/img/users_cars"), (err, files) => {
			let allCarsPhotosName = [];

			files.forEach(fileName => {
				allCarsPhotosName.push(fileName);
			});

			shuffleArray(allCarsPhotosName);

			const pageCount = Math.ceil(files.length / 12);
			let page = parseInt(req.query.page);

			if (!page) {
				page = 1;
			}

			if (page > pageCount) {
				page = pageCount
			}

			res.json({
				"page": page,
				"pageCount": pageCount,
				"files": allCarsPhotosName.slice(page * 12 - 12, page * 12)
			});

		});
	} catch (error) {
		console.log(error);
	}
})

app.post('/api/upload', async (req, res) => {
	try {
		if (req.files.avatar) {
			let { name } = req.files.avatar;
			let type = name.split('.').pop();
			let fileName = uuidv4(name) + '.' + type;
			console.log(fileName);
			await mv(path.resolve(__dirname, "..", "bot-back/img/users_cars", fileName));
			return res.json(fileName);
		}
	} catch (err) {
		console.log(err);
		res.status(500).send(err);
	}
})

app.post("/api/upload/remove", async (req, res) => {
	try {
		let { response } = req.body;
		if (response !== " ") {
			access(path.resolve(__dirname, "..", "bot-back/img/users_cars", response), (err) => {
				if (err) {
					return res.json("err");
				}
				unlink(path.resolve(__dirname, "..", "bot-back/img/users_cars", response), (err) => {
					if (err) return console.log(err);
					// console.log("file deleted successfully");
				});
			});
		}
	} catch (error) {
		console.log(error);
	}
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

		try {
			if (text === '/start') {
				let userChatId = await Users.findOne({ where: { chatId: chatId } });
				if (userChatId) {
					return (
						bot.sendMessage(
							chatId,
							`Привет, что тебя интересует? `,
							menu
						)
					)
				} else {
					return bot.sendMessage(
						chatId,
						`Добро пожаловать в телеграм бота VAG клуба Чебоксар!\nПожалуйста пройди регистрацию`,
						reg
					)
				}
			}
			if (text === "/info") {
				return (
					bot.sendMessage(
						chatId,
						`Привет привееет!\nНа связи VW/SK CLUB 21 - крупнейшее автосообщество ваговодов Чувашии☝🏻\n\nМы - одна большая семья, которая держится друг за друга, делится своими радостями и неудачами, а все остальные переживают это, помогают в решении вопроса и поддерживают!\nВсе любят покрасоваться своими ласточками и мы не исключение💥\nВвиду этого у нас стабильно проходят автовстречи, где собирается вся наша дружная семья и обсуждает все события в большом кругу.\nА затем флаги в руки и в конвой.\nМы проезжаем по центральным улицам Чебоксар, чтобы показать нашу активность и дружность.\nНе забудем сказать и про партнеров, которых у нас немало. И этот список постоянно пополняется. От доставки еды до ремонта турбины - огромное количество сфер готовы предоставить клубную скидку для таких умничек и молодцов😂😂\n\nУ тебя нет ВАГа, но ты настоящий фанат немецкого автопрома? Не переживай и приходи на встречу🥰 Мы любим и уважаем каждого участника.\nДумаем, что стало немного понятнее.\nПоэтому чего ждать - добро пожаловать к нам в клуб!!!🎉🎊🎉🎊🎉`
					)
				)
			}
			if (text === "Близжайшая встреча") {
				await bot.sendPhoto(chatId, './img/event.jpg');
				await bot.sendLocation(chatId, 56.135323, 47.242850);
				return (
					bot.sendMessage(
						chatId,
						`Дата: 25/12/2022\nВремя: 20:00\nМесто: ТЦ Карусель`,
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
			if (text === "Профиль") {
				return (
					bot.sendMessage(
						chatId,
						`Что хочешь сделать с профилем?`,
						profile
					)
				)
			}
			if (text === "Посмотреть мой профиль") {
				try {
					let profile = await Users.findOne({ where: { chatId: chatId } });
					if (profile.carImage) {
						await bot.sendPhoto(chatId, path.resolve(__dirname, "..", "bot-back/img/users_cars", profile.carImage))
					}
					return (
						bot.sendMessage(
							chatId,
							`Вы: ${profile.userName}\nВаше авто: ${profile.carModel}\nГод выпуска: ${profile.carYear}\nНомер авто: ${profile.carGRZ}\nПримечание: ${profile.carNote}`,
							menu
						)
					)
				} catch (error) {
					console.log(error);
				}
			}
			if (text === "Меню") {
				return (
					bot.sendMessage(
						chatId,
						`Что тебя интересует?`,
						menu
					)
				)
			}
		} catch (error) {
			return bot.sendMessage(chatId, 'Произошла какая то ошибка!', menu)
		}

		if (msg?.web_app_data?.data) {
			try {
				const data = await JSON.parse(msg?.web_app_data?.data)
				console.log(data.carImage);

				await Users.create({
					chatId: chatId,
					userName: data.name.trimEnd(),
					carModel: data.car.toLowerCase().trimEnd(),
					carYear: data.carYear.trimEnd(),
					carGRZ: data.carNum.trimEnd(),
					carNote: data.carNote.toLowerCase().trimEnd(),
					carImage: data.carImage
				})

				return (
					bot.sendMessage(
						chatId,
						`Добро пожаловать ${data.name.trimEnd()}!\nЧто тебя интересует?`,
						menu
					)
				)
			} catch (e) {
				console.log(e);
			}
		}
	})


}

start();