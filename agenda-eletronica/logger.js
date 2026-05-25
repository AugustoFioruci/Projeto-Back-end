const fs = require('fs');
const path = require('path');

const logDir = path.join(__dirname, 'logs');

if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
}

const logErro = (mensagem) => {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${mensagem}\n`;
    const logFile = path.join(logDir, 'erros.log');

    try {
        fs.appendFileSync(logFile, logMessage);
        console.error(logMessage);
    } catch (error) {
        console.error('Erro ao escrever no log:', error);
    }
};

const logInfo = (mensagem) => {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${mensagem}\n`;
    const logFile = path.join(logDir, 'info.log');

    try {
        fs.appendFileSync(logFile, logMessage);
        console.log(logMessage);
    } catch (error) {
        console.error('Erro ao escrever no log:', error);
    }
};

module.exports = logErro;
module.exports.logInfo = logInfo;
