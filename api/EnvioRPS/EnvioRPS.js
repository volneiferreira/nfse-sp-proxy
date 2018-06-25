module.exports = {

    /**
     * Send Lote RPS.
     *
     * @param {object} data
     * @param {function} cb
     */
    send: function (data, cb) {

        var request, fs, config, util, cert, key, messageTemplate, envelopeTemplate,
            envelope, options;

        request = require('request');
        fs = require('fs');
        util = require(__dirname + '/../util.js');

        config = util.getConfig();

        cert = fs.readFileSync(config.certPath);
        key = fs.readFileSync(config.keyPath);
        messageTemplate = fs.readFileSync(__dirname + '/message.xml', 'utf8');
        envelopeTemplate = fs.readFileSync(__dirname + '/envelope.xml', 'utf8');

        // Fixed data.
        data.cnpjRemetente = config.cnpj;
        data.incricaoPrestador = config.incricaoMunicipal;

        // Add sign.
        data.assinatura = util.buildRPSSign(key, data);

        // Build envelope.
        envelope = util.buildEnvelope(cert, key, data, messageTemplate, envelopeTemplate);

        // Build request options.
        options = util.buildRequestOptions(cert, key, envelope);

        // Send response.
        request(options, function (error, response, body) {
            util.handleResponse(error, body, cb, data.attachments);
        });
    }
};
