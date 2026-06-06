import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { VerifyStudentDto } from 'src/dto';

describe('UserController', () => {
  let controller: UserController;
  let userService: UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: {
            verifyStudent: jest.fn(),
            list: jest.fn(),
            create: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<UserController>(UserController);
    userService = module.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('verifyStudent', () => {
    it('should call userService.verifyStudent with req.user.sub and dto, then return serialized user', async () => {
      const mockUser = {
        id: 1,
        name: 'Student Name',
        username: 'student',
        roles: ['user'],
        akanProfileId: 'akan-123',
        enrollmentStatus: 'enrolled',
        isStudentVerified: true,
      };
      jest.spyOn(userService, 'verifyStudent').mockResolvedValue(mockUser as any);

      const req = { user: { sub: 1 } };
      const dto: VerifyStudentDto = { akanProfileId: 'akan-123', enrollmentStatus: 'enrolled' };

      const result = await controller.verifyStudent(req, dto);

      expect(userService.verifyStudent).toHaveBeenCalledWith(1, dto);
      expect(result).toBeDefined();
      expect(result.id).toBe(1);
      expect(result.name).toBe('Student Name');
      expect(result.username).toBe('student');
      expect(result.akanProfileId).toBe('akan-123');
      expect(result.enrollmentStatus).toBe('enrolled');
      expect(result.isStudentVerified).toBe(true);
    });
  });
});
