jest.mock('@nestjs/common', () => ({ Injectable: () => () => {}, BadRequestException: Error, ConflictException: Error, HttpException: Error, NotFoundException: Error, HttpStatus: { TOO_MANY_REQUESTS: 429 } }));
jest.mock('@nestjs/typeorm', () => ({ InjectRepository: () => () => {} }));
jest.mock('typeorm', () => ({ DataSource: class {}, Repository: class {} }));
jest.mock('../src/entities/poi.entity', () => ({ Poi: class {} }));
jest.mock('../src/entities/poi-translation.entity', () => ({ PoiTranslation: class {} }));
jest.mock('../src/entities/poi-audio.entity', () => ({ PoiAudio: class {} }));
jest.mock('../src/cache/poi-cache.service', () => ({ PoiCacheService: class {} }));
jest.mock('../src/sync/rev.service', () => ({ RevService: class {} }));
import { PoiService } from '../src/poi/poi.service';
import { Poi } from '../src/entities/poi.entity';
import { PoiTranslation } from '../src/entities/poi-translation.entity';
import { PoiAudio } from '../src/entities/poi-audio.entity';

jest.mock('@app/database/content-write', () => ({
  contentWrite: async (ds: any, work: any) => (await work(ds.manager)).value,
}));

describe('Audio generation requires an explicit request', () => {
  const originalProvider = process.env.TTS_PROVIDER;
  afterEach(() => {
    if (originalProvider === undefined) delete process.env.TTS_PROVIDER;
    else process.env.TTS_PROVIDER = originalProvider;
  });

  function setup() {
    process.env.TTS_PROVIDER = 'GEMINI';
    const poi = { id: 'poi', code: '1', mapId: 'map' };
    const translation = { id: 'translation', poiId: poi.id, langCode: 'vi', scriptText: 'Old text', textHash: 'old' };
    const audio = { id: 'audio', translationId: translation.id, source: 'TTS', status: 'READY', audioUrl: '/old.mp3', textHash: 'old', voiceGender: 'FEMALE' };
    const manager: any = {
      exists: jest.fn().mockResolvedValue(false),
      query: jest.fn().mockResolvedValue([]),
      create: jest.fn((_entity, value) => value),
      save: jest.fn(async (_entity, value) => ({ id: 'created', ...value })),
      update: jest.fn(),
      findOne: jest.fn(async entity => entity === Poi ? poi : translation),
      find: jest.fn(async entity => entity === PoiAudio ? [audio] : [translation]),
    };
    const service = new PoiService({ manager } as any, {} as any, {} as any, { invalidate: jest.fn() } as any, {} as any);
    jest.spyOn(service, 'findOneAdmin').mockResolvedValue(poi as any);
    const queue = jest.spyOn(service as any, 'queue').mockResolvedValue(undefined);
    return { service, manager, queue, poi };
  }

  it('creates TTS content without queuing a provider request', async () => {
    const { service, manager, queue } = setup();
    manager.query.mockResolvedValue([{ id: 'map' }]);
    await service.create({ code: '1', mapId: 'map', audioMode: 'TTS', translations: [{ langCode: 'vi', name: 'Stop', scriptText: 'New text' }] } as any);
    expect(queue).not.toHaveBeenCalled();
  });

  it('invalidates changed narration without automatically regenerating it', async () => {
    const { service, manager, queue, poi } = setup();
    manager.query.mockResolvedValue([{ id: 'map' }]);
    await service.update(poi.id, { translations: [{ langCode: 'vi', name: 'Stop', scriptText: 'New text' }] } as any);
    expect(manager.query).toHaveBeenCalledWith(expect.stringContaining("status='FAILED'"), ['translation']);
    expect(queue).not.toHaveBeenCalled();
  });

  it('still queues audio through the explicit generate endpoint', async () => {
    const { service, manager, queue, poi } = setup();
    manager.find.mockResolvedValue([]);
    expect(await service.generateMissing(poi.id, 'vi', 'FEMALE')).toEqual({ queued: 1, reason: 'QUEUED' });
    expect(queue).toHaveBeenCalledTimes(1);
  });
});
