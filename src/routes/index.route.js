const userRouter = require('./user.route.js');
const siteRouter = require('./site.route.js');
const conversationRouter = require('./conversation.route.js');

//======================//
function initRoutes(app) {
    app.use('/user', userRouter);
    app.use('/chat', conversationRouter);
    app.use('/', siteRouter);
}

module.exports = initRoutes;
