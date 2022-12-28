const sequelize = require('./db');
const { DataTypes } = require('sequelize');

const Users = sequelize.define('user', {
	id: { type: DataTypes.INTEGER, primaryKey: true, unique: true, autoIncrement: true },
	chatId: { type: DataTypes.BIGINT, unique: true },
	userName: { type: DataTypes.STRING, allowNull: false },
	carModel: { type: DataTypes.STRING, allowNull: false },
	carYear: { type: DataTypes.INTEGER, allowNull: false },
	carGRZ: { type: DataTypes.STRING, unique: true, allowNull: false },
	carNote: { type: DataTypes.STRING, allowNull: true },
	carImage: { type: DataTypes.STRING, allowNull: true },
}, {
	timestamps: false
})

module.exports = Users;