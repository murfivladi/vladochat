const fs = require('fs');
const path = require('path');

const dataFile = process.env.DATA_FILE || path.join(__dirname, 'data.json');

function load() {
  try {
    const raw = fs.readFileSync(dataFile, 'utf8');
    const parsed = JSON.parse(raw);
    return {
      accounts: new Map(Object.entries(parsed.accounts || {})),
      rooms: new Map(Object.entries(parsed.rooms || {})),
    };
  } catch (err) {
    return { accounts: new Map(), rooms: new Map() };
  }
}

function save(accounts, rooms) {
  const data = {
    accounts: Object.fromEntries(accounts),
    rooms: Object.fromEntries(rooms),
  };
  fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
}

module.exports = { load, save };
