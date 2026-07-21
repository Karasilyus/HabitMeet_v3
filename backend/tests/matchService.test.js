// DB bağlantısı açılmadan test: 4 model jest.mock() ile mock'lanır.
process.env.MIN_STREAK_DAYS = '3';

jest.mock('../src/models/habitModel');
jest.mock('../src/models/userModel');
jest.mock('../src/models/matchModel');
jest.mock('../src/models/blockModel');

const habitModel = require('../src/models/habitModel');
const userModel = require('../src/models/userModel');
const matchModel = require('../src/models/matchModel');
const blockModel = require('../src/models/blockModel');
const matchService = require('../src/services/matchService');

function daysAgo(n) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
}

// Bugünden geriye n günlük kesintisiz streak logları üretir.
const streakLogs = (n) =>
  Array.from({ length: n }, (_, i) => ({ date: daysAgo(i), completed: 1 }));

beforeEach(() => jest.clearAllMocks());

describe('processMatchesAfterLog', () => {
  test('streak eşiğin altındaysa eşleşme oluşturulmaz', async () => {
    habitModel.findById.mockResolvedValue({ id: 1, user_id: 10, type_id: 5 });
    habitModel.findLogsByHabit.mockResolvedValue(streakLogs(1));
    const result = await matchService.processMatchesAfterLog(10, 1);
    expect(result).toEqual([]);
    expect(matchModel.create).not.toHaveBeenCalled();
  });

  test('koşullar sağlandığında pending eşleşme oluşturulur', async () => {
    habitModel.findById.mockResolvedValue({ id: 1, user_id: 10, type_id: 5 });
    habitModel.findLogsByHabit.mockResolvedValue(streakLogs(3));
    userModel.findById.mockResolvedValue({ id: 10, neighborhood: 'Kadıköy' });
    habitModel.findCandidates.mockResolvedValue([{ id: 2, user_id: 20 }]);
    blockModel.isBlockedBetween.mockResolvedValue(false);
    matchModel.findExisting.mockResolvedValue(null);
    matchModel.create.mockResolvedValue({ id: 99, status: 'pending' });

    const result = await matchService.processMatchesAfterLog(10, 1);
    expect(matchModel.create).toHaveBeenCalledWith(10, 20, 5, 10);
    expect(result).toHaveLength(1);
  });

  test('zaten eşleşilmişse tekrar oluşturulmaz', async () => {
    habitModel.findById.mockResolvedValue({ id: 1, user_id: 10, type_id: 5 });
    habitModel.findLogsByHabit.mockResolvedValue(streakLogs(3));
    userModel.findById.mockResolvedValue({ id: 10, neighborhood: 'Kadıköy' });
    habitModel.findCandidates.mockResolvedValue([{ id: 2, user_id: 20 }]);
    blockModel.isBlockedBetween.mockResolvedValue(false);
    matchModel.findExisting.mockResolvedValue({ id: 50 });

    const result = await matchService.processMatchesAfterLog(10, 1);
    expect(matchModel.create).not.toHaveBeenCalled();
    expect(result).toEqual([]);
  });

  test('engellenen kullanıcıyla eşleşme oluşturulmaz (v2)', async () => {
    habitModel.findById.mockResolvedValue({ id: 1, user_id: 10, type_id: 5 });
    habitModel.findLogsByHabit.mockResolvedValue(streakLogs(3));
    userModel.findById.mockResolvedValue({ id: 10, neighborhood: 'Kadıköy' });
    habitModel.findCandidates.mockResolvedValue([{ id: 2, user_id: 20 }]);
    blockModel.isBlockedBetween.mockResolvedValue(true);

    const result = await matchService.processMatchesAfterLog(10, 1);
    expect(matchModel.create).not.toHaveBeenCalled();
    expect(result).toEqual([]);
  });
});
