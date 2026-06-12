import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';

describe('HealthController', () => {
  let controller: HealthController;
  const mockHealthService = {
    liveness: jest.fn().mockReturnValue({
      status: 'ok',
      service: 'akan-pay-api',
    }),
    readiness: jest.fn().mockResolvedValue({
      status: 'ok',
      database: 'up',
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [{ provide: HealthService, useValue: mockHealthService }],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  it('should return liveness from the health service', () => {
    expect(controller.liveness()).toEqual({
      status: 'ok',
      service: 'akan-pay-api',
    });
    expect(mockHealthService.liveness).toHaveBeenCalled();
  });

  it('should return readiness from the health service', async () => {
    await expect(controller.readiness()).resolves.toEqual({
      status: 'ok',
      database: 'up',
    });
    expect(mockHealthService.readiness).toHaveBeenCalled();
  });
});
