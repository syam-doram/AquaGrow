import fs from 'fs';
import path from 'path';

const DB_FILE = path.join(process.cwd(), 'server', 'db.json');

export const getMockData = () => {
    if (!fs.existsSync(DB_FILE)) {
      const initial = { 
        users: [], 
        ponds: [], 
        subscriptions: [], 
        waterLogs: [], 
        feedLogs: [], 
        medicineLogs: [], 
        sopLogs: [], 
        expenses: [],
        refreshTokens: []
      };
      fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2));
      return initial;
    }
    try {
        const content = fs.readFileSync(DB_FILE, 'utf-8');
        return JSON.parse(content || '{}');
    } catch (e) {
        return { users: [] };
    }
};

export const saveMockData = (data: any) => {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
};
