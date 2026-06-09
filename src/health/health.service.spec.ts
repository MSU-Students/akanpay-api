import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { HealthService } from './health.service';

describe('HealthService', () => {
  let service: HealthService;
  let dataSource: { query: jest.Mock };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HealthService,
        { provide: DataSource, useValue: { query: jest.fn() } },
      ],
    }).compile();

    service = module.get<HealthService>(HealthService);
    dataSource = module.get(DataSource);
  });

  it('should return liveness info', () => {
    expect(service.liveness()).toEqual({
      status: 'ok',
      service: 'akan-pay-api',
    });
  });

  it('should return readiness info after database query', async () => {
    dataSource.query.mockResolvedValueOnce([{ '1': 1 }]);

    await expect(service.readiness()).resolves.toEqual({
      status: 'ok',
      database: 'up',
    });
    expect(dataSource.query).toHaveBeenCalledWith('SELECT 1');
  });
});
