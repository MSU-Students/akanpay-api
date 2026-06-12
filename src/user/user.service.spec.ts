import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserService } from './user.service';
import { User, Wallet } from 'src/entities';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';

describe('UserService', () => {
  let service: UserService;
  let userRepository: Repository<User>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Wallet),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('verifyStudent', () => {
    it('should successfully verify student and update fields', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        isStudentVerified: false,
        akanProfileId: null,
        enrollmentStatus: null,
      };

      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser as any);
      jest.spyOn(userRepository, 'save').mockImplementation(async (user) => user as any);

      const dto = { akanProfileId: 'akan-123', enrollmentStatus: 'enrolled' };
      const result = await service.verifyStudent(1, dto);

      expect(userRepository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(result.isStudentVerified).toBe(true);
      expect(result.akanProfileId).toBe('akan-123');
      expect(result.enrollmentStatus).toBe('enrolled');
    });

    it('should default enrollmentStatus to "enrolled" if not provided', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        isStudentVerified: false,
        akanProfileId: null,
        enrollmentStatus: null,
      };

      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser as any);
      jest.spyOn(userRepository, 'save').mockImplementation(async (user) => user as any);

      const dto = { akanProfileId: 'akan-123' };
      const result = await service.verifyStudent(1, dto);

      expect(result.isStudentVerified).toBe(true);
      expect(result.akanProfileId).toBe('akan-123');
      expect(result.enrollmentStatus).toBe('enrolled');
    });

    it('should throw NotFoundException if user is not found', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);

      const dto = { akanProfileId: 'akan-123' };
      await expect(service.verifyStudent(999, dto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
