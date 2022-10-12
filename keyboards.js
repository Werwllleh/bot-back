const webAppUrl = 'https://chic-lolly-1605d1.netlify.app';

module.exports = {
	menu: {
		reply_markup: {
			// Добавляем все кнопки
			keyboard: [
				[{ text: 'Встречи' }, { text: 'Партнеры' }],
				[{ text: 'Наши авто' }, { text: 'Продажа авто' }],
				[{ text: 'Поиск авто' }, { text: 'Запросить помощь' }],
				[{ text: 'Профиль' }, { text: 'Поддержать клуб' }],
			],
		}
	},
	reg: {
		reply_markup: {
			keyboard: [
				[{
					text: "Регистрация", web_app: { url: webAppUrl + '/form' }
				}],
			],
		}
	},
	partners: {
		reply_markup: {
			inline_keyboard: [
				[{
					text: "Список партнеров", web_app: { url: webAppUrl + '/partners' }
				}],
			],
		}
	},
	ourcars: {
		reply_markup: {
			inline_keyboard: [
				[{
					text: "Автомобили участников клуба", web_app: { url: webAppUrl }
				}],
			],
		}
	},
	searchcar: {
		reply_markup: {
			inline_keyboard: [
				[{
					text: "Поиск автомобиля участника клуба", web_app: { url: webAppUrl + '/searchcar' }
				}],
			],
		}
	},
	profile: {
		reply_markup: {
			keyboard: [
				[{ text: 'Посмотреть мой профиль' }, { text: 'Отредактировать профиль' },],
				[{ text: 'Меню' }],
			],
		}
	},
	editprofile: {
		reply_markup: {
			keyboard: [
				[{ text: 'Изменить авто' }, { text: 'Изменить номер авто' },],
				[{ text: 'Изменить год авто' }, { text: 'Изменить примечание' },],
				[{ text: 'Меню' }],
			],
		}
	}
}