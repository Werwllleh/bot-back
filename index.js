require('dotenv').config();

const TelegramBot = require('node-telegram-bot-api');

const token = process.env.TOKEN;
process.env["NTBA_FIX_350"] = 1;

const bot = new TelegramBot(token, { polling: true });
const { menu, reg, partners, ourcars, searchcar, profile, changeProfile, deleteProfile } = require('./keyboards');
const sequelize = require('./db');
const Users = require("./models");

const express = require('express');
const fileUpload = require('express-fileupload');
const cors = require('cors');
const { access, unlink, readdir } = require('fs');
const { v4: uuidv4 } = require('uuid');
const mv = require('mv');
const path = require("path");
const sharp = require("sharp");
const { json } = require('body-parser');
const e = require('express');

const app = express();

app.use(express.json());

app.use("/api/image", express.static("img/users_cars"));
app.use("/api/image/small", express.static("img/users_small"));

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

function deleteDoubleImg() {
	try {
		let photosQuery = Users.findAll({
			attributes: ['carImage'],
			raw: true
		}).then(function (results) {
			let photosInDB = results.map((i) => i.carImage)

			readdir(path.resolve(__dirname, "..", "bot-back/img/users_cars"), (err, files) => {

				let photosInDIR = [];

				files.forEach(photoName => {
					photosInDIR.push(photoName);
				});

				if (photosInDB.length != photosInDIR.length) {
					let diffPhotos = photosInDIR.filter(i => !photosInDB.includes(i));

					diffPhotos.forEach((dPhoto) => {
						unlink(path.resolve(__dirname, "..", "bot-back/img/users_cars", dPhoto), (err) => {
							if (err) throw err;
							console.log('dPhoto was deleted');
						});
					})
				}
			})
		});
	} catch (error) {
		console.log(error);
	}
}

app.get('/api/ourcars', async (req, res) => {
	try {
		readdir(path.resolve(__dirname, "..", "bot-back/img/users_cars"), (err, files) => {
			let allCarsPhotosName = [];

			files.forEach(fileName => {
				allCarsPhotosName.push(fileName);
			});

			//shuffleArray(allCarsPhotosName);

			const pageCount = Math.ceil(files.length / 20);
			let page = parseInt(req.query.page);

			if (!page) {
				page = 1;
			}

			if (page > pageCount) {
				page = pageCount
			}

			res.json({
				"page": page,
				"countPhotos": allCarsPhotosName.length,
				"pageCount": pageCount,
				"files": allCarsPhotosName.slice(page * 20 - 20, page * 20)
			});

		});
	} catch (error) {
		console.log(error);
	}
})

app.post('/api/upload', async (req, res) => {
	try {
		if (req.files.avatar) {
			let { avatar } = req.files;
			let type = avatar.name.split('.').pop();
			let fileName = uuidv4(avatar.name) + '.' + type;
			await avatar.mv(path.resolve(__dirname, "..", "bot-back/img/users_cars", fileName));

			return res.json(fileName);
		}
	} catch (err) {
		res.status(500).send(err);
	}
})

async function resizeImage() {
	try {
		readdir(path.resolve(__dirname, "..", "bot-back/img/users_cars"), (err, files) => {

			files.forEach(smallCard => {

				const metadata = sharp(path.resolve(__dirname, "..", "bot-back/img/users_cars", smallCard)).metadata();

				metadata.then(function (photoData) {

					let orientationPhoto = photoData.orientation;

					let wPhoto = Math.ceil(photoData.width - (photoData.width * 60) / 100);
					let hPhoto = Math.ceil(photoData.height - (photoData.height * 60) / 100);

					if (orientationPhoto === 6) {
						sharp(path.resolve(__dirname, "..", "bot-back/img/users_cars", smallCard))
							.rotate(90)
							.resize(wPhoto, hPhoto)
							.toFormat("jpeg", { mozjpeg: true, quality: 65 })
							.toFile(path.resolve(__dirname, "..", "bot-back/img/users_small", smallCard + "_" + "small.jpeg"));
					} else if (orientationPhoto === 3) {
						sharp(path.resolve(__dirname, "..", "bot-back/img/users_cars", smallCard))
							.rotate(180)
							.resize(wPhoto, hPhoto)
							.toFormat("jpeg", { mozjpeg: true, quality: 65 })
							.toFile(path.resolve(__dirname, "..", "bot-back/img/users_small", smallCard + "_" + "small.jpeg"));
					} else {
						sharp(path.resolve(__dirname, "..", "bot-back/img/users_cars", smallCard))
							.resize(wPhoto, hPhoto)
							.toFormat("jpeg", { mozjpeg: true, quality: 65 })
							.toFile(path.resolve(__dirname, "..", "bot-back/img/users_small", smallCard + "_" + "small.jpeg"));
					}
				})
			});

		})
	} catch (error) {
		console.log(error);
	}
}

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

app.post('/api/change', async (req, res) => {
	try {

		let changedData = req.body.changedData; //получаем новые данные
		let searchUser = await Users.findOne({ where: { chatId: changedData.curUser } }); //смотрим старые данные в БД

		if (searchUser.carImage) {
			unlink(path.resolve(__dirname, "..", "bot-back/img/users_cars", searchUser.carImage), (err) => {
				if (err) console.log(err);
				console.log('original photo was deleted');
			});
		}

		if (searchUser.carImage + "_" + "small.jpeg" !== undefined) {
			unlink(path.resolve(__dirname, "..", "bot-back/img/users_small", searchUser.carImage + "_" + "small.jpeg"), (err) => {
				if (err) console.log(err);
				console.log('preview photo was deleted');
			});
		}

		const metadata = sharp(path.resolve(__dirname, "..", "bot-back/img/users_cars", changedData.carImage)).metadata();

		metadata.then(function (photoData) {

			let orientationPhoto = photoData.orientation;

			let wPhoto = Math.ceil(photoData.width - (photoData.width * 60) / 100);
			let hPhoto = Math.ceil(photoData.height - (photoData.height * 60) / 100);

			if (orientationPhoto === 6) {
				sharp(path.resolve(__dirname, "..", "bot-back/img/users_cars", changedData.carImage))
					.rotate(90)
					.resize(wPhoto, hPhoto)
					.toFormat("jpeg", { mozjpeg: true, quality: 65 })
					.toFile(path.resolve(__dirname, "..", "bot-back/img/users_small", changedData.carImage + "_" + "small.jpeg"));
			} else if (orientationPhoto === 3) {
				sharp(path.resolve(__dirname, "..", "bot-back/img/users_cars", changedData.carImage))
					.rotate(180)
					.resize(wPhoto, hPhoto)
					.toFormat("jpeg", { mozjpeg: true, quality: 65 })
					.toFile(path.resolve(__dirname, "..", "bot-back/img/users_small", changedData.carImage + "_" + "small.jpeg"));
			} else {
				sharp(path.resolve(__dirname, "..", "bot-back/img/users_cars", changedData.carImage))
					.resize(wPhoto, hPhoto)
					.toFormat("jpeg", { mozjpeg: true, quality: 65 })
					.toFile(path.resolve(__dirname, "..", "bot-back/img/users_small", changedData.carImage + "_" + "small.jpeg"));
			}
		})

		await Users.update(
			{
				carbrand: changedData.carBrand,
				carModel: changedData.carModel,
				carYear: changedData.carYear.trimEnd(),
				carGRZ: changedData.carNum.trimEnd(),
				carNote: changedData.carNote.toLowerCase().trimEnd(),
				carImage: changedData.carImage,
			},
			{
				where: { chatId: changedData.curUser },
			}
		);

	} catch (err) {
		console.log(err);
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
		{ command: '/info', description: 'О клубе' },
		{ command: '/start', description: 'Обновление/перезапуск бота' },
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
			} else if (text === "/info") {
				return (
					bot.sendMessage(
						chatId,
						`Привет привееет!\nНа связи VW/SK CLUB 21 - крупнейшее автосообщество ваговодов Чувашии☝🏻\n\nМы - одна большая семья, которая держится друг за друга, делится своими радостями и неудачами, а все остальные переживают это, помогают в решении вопроса и поддерживают!\nВсе любят покрасоваться своими ласточками и мы не исключение💥\nВвиду этого у нас стабильно проходят автовстречи, где собирается вся наша дружная семья и обсуждает все события в большом кругу.\nА затем флаги в руки и в конвой.\nМы проезжаем по центральным улицам Чебоксар, чтобы показать нашу активность и дружность.\nНе забудем сказать и про партнеров, которых у нас немало. И этот список постоянно пополняется. От доставки еды до ремонта турбины - огромное количество сфер готовы предоставить клубную скидку для таких умничек и молодцов😂😂\n\nУ тебя нет ВАГа, но ты настоящий фанат немецкого автопрома? Не переживай и приходи на встречу🥰 Мы любим и уважаем каждого участника.\nДумаем, что стало немного понятнее.\nПоэтому чего ждать - добро пожаловать к нам в клуб!!!🎉🎊🎉🎊🎉`
					)
				)
			} else if (text === "КВЕСТ!" | text === "Ближайшая встреча") {
				await bot.sendLocation(chatId, 56.135323, 47.242850);
				return (
					bot.sendMessage(
						chatId,
						`Дата: 28/05/2023\nВремя: 20:00\nМесто: ТЦ Карусель`,
						menu
					)
				)
				// return (
				// 	bot.sendMessage(
				// 		chatId,
				// 		`Ждем на встрече в мае)`,
				// 		menu
				// 	)
				// )
				/* 56.135323, 47.242850 */ //карусель
				/* 56.129276, 47.299828 */ //Фердинанд-моторс

				/* await bot.sendPhoto(chatId, './img/event.jpeg');
				await bot.sendLocation(chatId, 56.135323, 47.242850);
				return (
					bot.sendMessage(
						chatId,
						`Дата: 20/05/2023\nВремя: 20:00\nМесто: ТЦ Карусель`,
						menu
					)
				) */
				// await bot.sendVideo(chatId, './img/preview-quest.mp4', options = { has_spoiler: true });
				// await bot.sendLocation(chatId, 56.129276, 47.299828);
				// return (
				// 	bot.sendMessage(
				// 		chatId,
				// 		`Дата: 22/04/2023\nВремя: 12:00\nАдрес: Чебоксары, Марпосадское шоссе, 3Д\nЗдание: Фердинанд Моторс Альянс-авто`,
				// 		menu
				// 	)
				// )
			} else if (text === "Партнеры") {
				return (
					bot.sendMessage(
						chatId,
						`Выбери партнера и получи скидку 👇`,
						partners
					)
				)
			} else if (text === "Наши авто") {
				return (
					bot.sendMessage(
						chatId,
						`Фотографии автомобилей участников 👇`,
						ourcars
					)
				)
			} else if (text === "Поиск авто") {
				return (
					bot.sendMessage(
						chatId,
						`Перейди, если хочешь найти авто по номеру 👇`,
						searchcar
					)
				)
			} else if (text === "Профиль") {
				return (
					bot.sendMessage(
						chatId,
						`Что хочешь сделать с профилем?`,
						profile
					)
				)
			} else if (text === "Посмотреть мой профиль") {
				try {
					let profile = await Users.findOne({ where: { chatId: chatId } });
					if (profile.carImage) {
						await bot.sendPhoto(chatId, path.resolve(__dirname, "..", "bot-back/img/users_cars", profile.carImage))
					}
					return (
						bot.sendMessage(
							chatId,
							`Вы: ${profile.userName}\nВаше авто: ${profile.carbrand} ${profile.carModel}\nГод выпуска: ${profile.carYear}\nНомер авто: ${profile.carGRZ}\n${profile.carNote ? 'Примечание: ' + profile.carNote : ''}`,
							profile
						)
					)
				} catch (error) {
					console.log(error);
				}
			} else if (text === "Отредактировать профиль") {
				return (
					bot.sendMessage(
						chatId,
						'Перейди, если хочешь изменить данные своего профиля  👇',
						changeProfile
					)
				)
			} else if (text === "УДАЛИТЬ профиль") {
				return (
					bot.sendMessage(
						chatId,
						'Вы уверены?',
						deleteProfile
					)
				)
			} else if (text === "Да, хочу удалить профиль") {
				try {
					let profile = await Users.findOne({ where: { chatId: chatId } });
					unlink(path.resolve(__dirname, "..", "bot-back/img/users_cars", profile.carImage), (err) => {
						if (err) console.log(err);
					});
					unlink(path.resolve(__dirname, "..", "bot-back/img/users_small", profile.carImage + "_" + "small.jpeg"), (err) => {
						if (err) console.log(err);
					});
					await Users.destroy({
						where: {
							chatId: chatId
						}
					})
				} catch (error) {
					console.log(error);
				}
				await bot.sendMessage(
					chatId,
					`Ваш профиль удален, нельзя покидать семью 😢😭`
				)
				return bot.sendMessage(
					chatId,
					`Пожалуйста пройди регистрацию 🙏`,
					reg
				)
			} else if (text === "Нет, вернуться в меню") {
				return (
					bot.sendMessage(
						chatId,
						`Что тебя интересует?`,
						menu
					)
				)
			} else if (text === "Меню") {
				return (
					bot.sendMessage(
						chatId,
						`Что тебя интересует?`,
						menu
					)
				)
			} else if (text === "Купить клубную наклейку/ароматизатор" | text === "Поддержать клуб") {
				await bot.sendMessage(chatId, 'Приобретая клубную атрибутику ты помогаешь клубу развиваться и становишься виднее для одноклубников😉\nПо всем вопросам приобретения наклеек и ароматизаторов смело пишите @BivaetITak');
				await bot.sendMessage(chatId, 'А так же будем рады любой копеечке:');
				await bot.sendMessage(chatId, '2202 2001 3923 4809');
				return bot.sendMessage(
					chatId,
					'Заранее спасибо:)'
				)
			}
		} catch (error) {
			return bot.sendMessage(chatId, 'Произошла какая то ошибка!', menu)
		}

		if (msg?.web_app_data?.data) {
			try {
				const data = await JSON.parse(msg?.web_app_data?.data)

				await Users.create({
					chatId: chatId,
					userName: data.name.trimEnd(),
					carModel: data.carModel,
					carYear: data.carYear.trimEnd(),
					carGRZ: data.carNum.trimEnd(),
					carNote: data.carNote.toLowerCase().trimEnd(),
					carImage: data.carImage,
					carbrand: data.carBrand,
				})

				const metadata = await sharp(path.resolve(__dirname, "..", "bot-back/img/users_cars", data.carImage)).metadata();
				let orientationPhoto = metadata.orientation;
				let wPhoto = Math.ceil(metadata.width - (metadata.width * 60) / 100);
				let hPhoto = Math.ceil(metadata.height - (metadata.height * 60) / 100);

				if (orientationPhoto === 6) {
					await sharp(path.resolve(__dirname, "..", "bot-back/img/users_cars", data.carImage))
						.rotate(90)
						.resize(wPhoto, hPhoto)
						.toFormat("jpeg", { mozjpeg: true, quality: 65 })
						.toFile(path.resolve(__dirname, "..", "bot-back/img/users_small", data.carImage + "_" + "small.jpeg"));
				} else if (orientationPhoto === 3) {
					await sharp(path.resolve(__dirname, "..", "bot-back/img/users_cars", data.carImage))
						.rotate(180)
						.resize(wPhoto, hPhoto)
						.toFormat("jpeg", { mozjpeg: true, quality: 65 })
						.toFile(path.resolve(__dirname, "..", "bot-back/img/users_small", data.carImage + "_" + "small.jpeg"));
				} else {
					await sharp(path.resolve(__dirname, "..", "bot-back/img/users_cars", data.carImage))
						.resize(wPhoto, hPhoto)
						.toFormat("jpeg", { mozjpeg: true, quality: 65 })
						.toFile(path.resolve(__dirname, "..", "bot-back/img/users_small", data.carImage + "_" + "small.jpeg"));
				}

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