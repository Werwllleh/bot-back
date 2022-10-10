module.exports = {
	menu: {
		reply_markup: {
			// Добавляем все кнопки
			keyboard: [
				[{ text: 'Мероприятия' }, { text: 'Партнеры' }],
				[{ text: 'Наши авто' }, { text: 'Продажа авто' }],
				[{ text: 'Запросить помощь' }, { text: 'Поддержать клуб' },],
				[{ text: 'Профиль' }],
			],
		}
	},
	reg: {
		reply_markup: {
			keyboard: [
				[{
					text: "Регистрация",
					web_app: {
						url: "https://193.164.149.140/form.html"
					}
				}],
			],
		}
	},
	partners: {
		reply_markup: {
			inline_keyboard: [
				[{
					text: "Список партнеров",
					web_app: {
						url: "https://193.164.149.140/partners.html"
					}
				}],
			],
		}
	},
	ourcars: {
		reply_markup: {
			inline_keyboard: [
				[{
					text: "Автомобили участников",
					web_app: {
						url: "https://193.164.149.140/ourcars.html"
					}
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