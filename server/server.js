module.exports = function (config) {
  var express = require('express');
  var bodyParser = require('body-parser');
  var morgan = require('morgan');
  var csrf = require('csurf');
  var messina = require('messina')('webmaker-profile-2-' + config.nodeEnv);
  var WebmakerAuth = require('webmaker-auth');
  var path = require('path');
  var argv = require('optimist').argv;
  var i18n = require('webmaker-i18n');
  var defaultLang = 'en-US';

  var webmakerAuth = new WebmakerAuth({
    // required
    loginURL: config.loginUrl,
    secretKey: config.sessionSecret,

    // optional
    authLoginURL: config.loginUrlWithAuth,
    domain: config.cookieDomain, // default undefined
    forceSSL: config.forceSSL // default false
  });

  // Determine paths for temporary files used by Live Reload task (if used)
  var lrRelativePath = argv.path;
  var lrAbsolutePath = lrRelativePath ? path.resolve(__dirname, lrRelativePath) : undefined;

  var app = express();
  var routes = require('./routes')(config, webmakerAuth, lrRelativePath);
  var middleware = require('./middleware')(config);

  if (config.enableGELFLogs) {
    app.use(messina.middleware());
  } else {
    app.use(morgan('dev'));
  }

  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded());
  app.use(webmakerAuth.cookieParser());
  app.use(webmakerAuth.cookieSession());
  app.use(csrf());

  // Setup locales with i18n
  app.use( i18n.middleware({
    supported_languages: config.SUPPORTED_LANGS || [defaultLang],
    default_lang: defaultLang,
    mappings: require('webmaker-locale-mapping'),
    translation_directory: path.resolve(__dirname, '../locale')
  }));

  app.use(routes);
  app.use(middleware.errorHandler);
  app.use('/user', express.static(lrAbsolutePath || __dirname + '/../app'));

  return app;
};
