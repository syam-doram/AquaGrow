const fs = require('fs');
const path = require('path');

const filePath = 'c:\\Users\\syamk\\Downloads\\Aquagrow\\src\\translations.ts';
let content = fs.readFileSync(filePath, 'utf8');

const keys = [
  'nextFeed', 'fcrCalculator', 'feedConversionRatio', 'currentFCR', 'biomassEst', 'recalculateRatio', 
  'todaysConsumption', 'seeHistory', 'logFeedEntry', 'brand', 'qtyKg', 'scheduled', 'amavasyaWarning', 
  'ashtamiWarning', 'moonPhaseTitle', 'massMoltingRisk', 'newMoonDay', 'fullAerationNight', 
  'reduceFeedBy30', 'immunityBoosterVitaminC', 'lunarPlanApplied', 'expertMentor', 'todayTask', 
  'sopDescription', 'medicineBrand', 'recommendedDose', 'viewChecklist', 'complianceRule', 
  'criticalStageAlert', 'stage5g', 'stage15g', 'stage25g', 'stage35g', 'daysTaken', 'sinceStocking', 
  'dailyLogTitle', 'acclimatizationDone', 'probioticApplied', 'aerationLevel', 'mineralsApplied', 
  'gutProbioticMixed', 'zeoliteApplied', 'sludgeChecked', 'vibriosisSigns', 'feedTrayCheck', 
  'immunityBoostersAdded', 'aerator24h', 'pondBottomCleaned', 'waterExchangeDone', 'targetSizeAchieved', 
  'cultureSOP', 'stockingDensity', 'aeratorRequirement', 'cultureSchedule', 'medicinesPlan', 
  'warningSigns', 'productionExpectation', 'practicalTips', 'earlyStage', 'highRiskPeriod', 
  'finalStage', 'lowOxygenSigns', 'diseaseSymptoms'
];

const languages = ['English', 'Telugu', 'Bengali', 'Odia', 'Gujarati', 'Tamil', 'Malayalam'];

languages.forEach(lang => {
  const startMarker = `${lang}: {`;
  const startIdx = content.indexOf(startMarker);
  if (startIdx === -1) return;
  
  const endMarker = '},';
  let endIdx = content.indexOf(endMarker, startIdx);
  
  let langContent = content.slice(startIdx, endIdx);
  
  keys.forEach(key => {
    if (!langContent.includes(`${key}:`)) {
       langContent += `    ${key}: '${key}',\n`;
    }
  });
  
  content = content.slice(0, startIdx) + langContent + content.slice(endIdx);
});

fs.writeFileSync(filePath, content);
console.log('Synced all languages with keys');
