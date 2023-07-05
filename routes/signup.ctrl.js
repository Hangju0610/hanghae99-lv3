const express = require('express');

const dotenv = require('dotenv');
const bcrypt = require('bcrypt');
const { signupSchema } = require('../middlewares/auth.validation.js');
const { Users } = require('../models');

dotenv.config();

const router = express.Router();

// 회원가입
router.post('/', async (req, res) => {
  try {
    const { nickname, password, confirmPassword } = req.body;
    const isExistUser = await Users.findOne({ where: { nickname } });
    // Password 내 nickname 확인용 정규표현식 진행
    const regexp = new RegExp(`${nickname}`);
    // Joi를 활용한 유효성 검사 진행 => error가 있는 경우 error 객체 생성
    const { error } = signupSchema.validate({
      nickname,
      password,
      confirmPassword,
    });
    // 유효성 검사 시 발생 한 error가 있을 경우
    if (error) {
      return res.status(412).json({ errorMessage: error.details[0].message });
    }
    if (isExistUser) {
      return res.status(412).json({ errorMessage: '중복된 닉네임 입니다.' });
    }
    // 정규표현식을 활용하여 Password 내 nickname 확인용 정규표현식 진행
    if (regexp.test(password)) {
      return res
        .status(412)
        .json({ errorMessage: '패스워드에 닉네임이 포함되어 있습니다.' });
    }

    // 비밀번호 암호화 진행. bcrypt 사용하여 Salt와 hash 사용
    const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_SALT));
    const hashedPassword = await bcrypt.hash(password, salt);

    // 암호화된 비밀번호로 저장
    await Users.create({
      nickname,
      password: hashedPassword,
    });

    return res.status(201).json({ message: '회원가입이 완료되었습니다. ' });
  } catch (err) {
    console.error(err);
  }
});

module.exports = router;
