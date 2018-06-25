(function(){

    'use strict';

    var restify = require('restify'),
        errors = require('restify-errors'),
        server = restify.createServer();

    server.use(restify.plugins.authorizationParser());
    server.use(restify.plugins.queryParser());
    server.use(restify.plugins.bodyParser());

    /**
     * Validate authentication.
     */
    /*server.use(function (req, res, next) {

        // Authentication example.

        var USER = 'admin', PASSWORD = '12345';

        if (req.username != USER || req.authorization.basic.password != PASSWORD) {
            return next(new errors.UnauthorizedError());
        } else {
            return next();
        }
    });*/

    /**
     * POST - Consulta NFe.
     */
    server.post('/api/ConsultaNFe', function (req, res, next) {

        res.header('Content-Type', 'application/json');

        try {

            var module = require('./api/ConsultaNFe/ConsultaNFe.js');

            if (req.body.attachments && req.body.attachments.webhook) {

                module.send(req.body);
                res.send({ success: true });

            } else {

                module.send(req.body, function (response) {
                    res.send(response);
                });
            }

        } catch (e) {
            res.send(new errors.InternalServerError(e.stack));
        }

        return next(false);
    });

    /**
     * POST - Envio Lote RPS.
     */
    server.post('/api/EnvioLoteRPS', function (req, res, next) {

        res.header('Content-Type', 'application/json');

        try {

            var module = require('./api/EnvioLoteRPS/EnvioLoteRPS.js');

            if (req.body.attachments && req.body.attachments.webhook) {

                module.send(req.body);
                res.send({ success: true });

            } else {

                module.send(req.body, function (response) {
                    res.send(response);
                });
            }

        } catch (e) {
            res.send(new errors.InternalServerError(e.stack));
        }

        return next(false);
    });

    /**
     * POST - Envio RPS.
     */
    server.post('/api/EnvioRPS', function (req, res, next) {

        res.header('Content-Type', 'application/json');

        try {

            var module = require('./api/EnvioRPS/EnvioRPS.js');

            if (req.body.attachments && req.body.attachments.webhook) {

                module.send(req.body);
                res.send({ success: true });

            } else {

                module.send(req.body, function (response) {
                    res.send(response);
                });
            }

        } catch (e) {
            res.send(new errors.InternalServerError(e.stack));
        }

        return next(false);
    });

    /**
     * Handle internal errors.
     */
    server.on('InternalServer', function (req, res, err, cb) {
        return cb();
    });

    /**
     * Init server.
     */
    server.listen(3000, function() {
        console.log('Server running at port 3000!');
    });

}());
