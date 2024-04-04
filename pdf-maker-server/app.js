const cookieParser = require('cookie-parser');
const cors = require('cors');
const dotenv = require('dotenv');
const express = require('express');
const session = require('express-session');
const morgan = require('morgan');
const passport = require('passport');
const path = require('path');

// .env 파일로부터 환경변수 로드
dotenv.config();

// 라우터 등 require
const authRouter = require('./routes/auth');
const fileRouter = require('./routes/file');
const { sequelize } = require('./models');
const passportConfig = require('./passport');

// Express 애플리케이션 생성
const app = express();

// Passport 인증 설정 초기화
passportConfig();

// 포트 설정
app.set('port', process.env.PORT || 8000);

// 시퀄라이즈: MySQL 연동
sequelize.sync({ force: false })
	.then(() => {
		console.log('데이터베이스 연결 성공');
	})
	.catch((err) => {
		console.error(err);
	});

// CORS 설정
app.use(cors({
	origin: 'http://localhost:5173',
	credentials: true,
}));

// 미들웨어 셋팅
app.use(morgan('dev'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(session({
	resave: false,
	saveUninitialized: false,
	secret: process.env.SESSION_SECRET,
	cookie: {
		httpOnly: true,
		secure: false,
	},
}));

// passport 모듈 app에 연결
app.use(passport.initialize);
app.use(passport.session);

// 라우터 연결
app.use('/auth', authRouter);
app.use('/file', fileRouter);

// 404 Not Found 에러 캐치
app.use((req, res, next) => {
	const error = new Error(`${req.method} ${req.url} 라우터가 없습니다.`);
	error.status = 404;
	next(error);
});

// 에러 핸들링 미들웨어
app.use((err, req, res, next) => {
  res.status(err.status || 500).send({
    error: {
      message: err.message,
    }
  });
});

// 서버 실행
app.listen(app.get('port'), () => {
	console.log(app.get('port'), '번 포트에서 대기 중');
});
