module.exports = {

    /**
     * Build envelope.
     * 
     * @param {string} cert
     * @param {string} key
     * @param {object} data
     * @param {string} messageTemplate
     * @param {string} envelopeTemplate
     */
    buildEnvelope: function (cert, key, data, messageTemplate, envelopeTemplate) {

        var mustache, message;

        mustache = require('mustache');

        message = mustache.render(messageTemplate, data);

        return mustache.render(envelopeTemplate, {
            message: util.signXML(cert, key, message)
        });
    },

    /**
     * Build request options.
     *
     * @param {string} cert
     * @param {string} key
     * @param body
     * @returns {{}}
     */
    buildRequestOptions: function (cert, key, body) {
        return {
            method: 'POST',
            url: 'https://nfe.prefeitura.sp.gov.br/ws/lotenfe.asmx',
            cert: cert,
            key: key,
            headers: {
                'Content-Type': 'text/xml; charset=utf-8',
                'Content-Length': Buffer.byteLength(body)
            },
            body: body
        };
    },

    /**
     * Build RPS sign.
     *
     * @param {string} key
     * @param data
     * @returns {string}
     */
    buildRPSSign: function (key, data) {

        var stringToSign, crypto, signer;

        stringToSign = '';

        stringToSign += data.incricaoPrestador;
        stringToSign += this._format(data.serieRps, false, 5, ' ', 'right');
        stringToSign += this._format(data.numeroRps, false, 12, '0', 'left');
        stringToSign += this._format(data.dataEmissao, true);
        stringToSign += data.tributacaoRps;
        stringToSign += data.statusRps;
        stringToSign += data.issRetido ? 'S' : 'N';
        stringToSign += this._format(data.valorServicos, true, 15, '0', 'left');
        stringToSign += this._format(data.valorDeducoes, true, 15, '0', 'left');
        stringToSign += this._format(data.codigoServico, false, 5, '0', 'left');

        if (data.tomador.cpf) {
            stringToSign += '1';
            stringToSign += this._format(data.tomador.cpf, false, 14, '0', 'left');
        } else if (data.tomador.cnpj) {
            stringToSign += '2';
            stringToSign += this._format(data.tomador.cnpj, false, 14, '0', 'left');
        } else {
            stringToSign += '3';
            stringToSign += this._format('', false, 14, '0', 'left');
        }

        crypto = require('crypto');
        signer = crypto.createSign('RSA-SHA1');

        signer.update(Buffer.from(stringToSign, 'ascii'));

        return signer.sign(key, 'base64');
    },

    /**
     * Get configuration.
     * 
     * @returns {object}
     */
    getConfig: function () {

        var config = require(__dirname + '/../config.js');

        config.certPath = __dirname + '/../ssl/cert.pem';
        config.keyPath = __dirname + '/../ssl/key.pem';

        return config;
    },

    /**
     * Handle response.
     * 
     * @param {object} error
     * @param {string | object} body
     * @param {function} cb
     * @param {object} attachments
     * @returns {void}
     */
    handleResponse: function (error, body, cb, attachments) {
        if (cb) {

            if (error) {
                cb({
                    code: 'SendingRequestError',
                    message: error.stack
                });
            } else {
                cb(this._parseBodyResponse(body));
            }

        } else {

            if (error) {
                this._sendResponse(error, attachments);
            } else {
                this._sendResponse(body, attachments);
            }
        }
    },

    /**
     * Sign xml.
     *
     * @param {string} cert
     * @param {string} key
     * @param xml
     * @returns {xml}
     */
    signXML: function (cert, key, xml) {

        var SignedXml = require('xml-crypto').SignedXml,
            cleanedKey = this._cleanKey(cert),
            signer = new SignedXml();

        function KeyInfo() {
            this.getKeyInfo = function () {
                return "<X509Data><X509Certificate>" + cleanedKey + "</X509Certificate></X509Data>";
            };
            this.getKey = function () {
                return key;
            }
        }

        signer.keyInfoProvider = new KeyInfo();
        signer.signatureAlgorithm = 'http://www.w3.org/2000/09/xmldsig#rsa-sha1';
        signer.canonicalizationAlgorithm = 'http://www.w3.org/2001/10/xml-exc-c14n#';
        signer.addReference("/*", [
            'http://www.w3.org/2000/09/xmldsig#enveloped-signature',
            'http://www.w3.org/TR/2001/REC-xml-c14n-20010315'
        ]);
        signer.references[0].isEmptyUri = true;
        signer.signingKey = key;
        signer.computeSignature(xml);

        return signer.getSignedXml();
    },

    /**
     * Clean key.
     *
     * @param {string} key
     * @returns {string}
     * @private
     */
    _cleanKey: function (key) {

        key = String(key);

        // Remove break lines.
        key = key.replace(/[\r|\n]/g, '');

        // Get just hash.
        key = key.split('-----')[2];

        return key;
    },

    /**
     * Format.
     *
     * @param {string} str
     * @param {boolean} clean
     * @param {number} [finalLength]
     * @param {string} [filler]
     * @param {string} [direction]
     * @returns {string}
     * @private
     */
    _format: function (str, clean, finalLength, filler, direction) {

        if (clean) {
            str = str.replace(/\D/g, '');
        }

        if (finalLength) {
            while (str.length < finalLength) {
                if (direction === 'left') {
                    str = filler + str;
                } else {
                    str += filler;
                }
            }
        }

        return str;
    },

    /**
     * Parse body response.
     *
     * @param body
     * @returns {{}}
     */
    _parseBodyResponse: function (body) {

        var dom, decode, ret, xml;

        dom = require('xmldom').DOMParser;
        decode = require('unescape');

        ret = decode(String(body).substring(body.indexOf('<RetornoXML>') + 12, body.indexOf('</RetornoXML>')));
        xml = new dom().parseFromString(ret);

        return this._xmlToJson(xml);
    },

    /**
     * Send response.
     * 
     * @param {string} body
     * @param {object} attachment
     * @returns {void}
     */
    _sendResponse: function (body, attachment) {

        var request, options;

        request = require('request');

        options = {
            method: 'POST',
            url: attachment.webhook,
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0'
            },
            body: JSON.stringify({
                response: body.indexOf ? this._parseBodyResponse(body) : body,
                attachment: attachment
            })
        };

        request(options);
    },

    /**
     * XML to JSON obj.
     * 
     * @param node
     * @returns {{}}
     * @private
     */
    _xmlToJson: function (node) {
        
        var	data = {};
        
        // append a value
        function Add (name, value) {
            if (data[name]) {
                if (data[name].constructor != Array) {
                    data[name] = [data[name]];
                }
                data[name][data[name].length] = value;
            }
            else {
                data[name] = value;
            }
        }
        
        // child elements
        for (var c = 0; cn = node.childNodes[c]; c++) {
            
            if (cn.nodeType == 1) {
                if (cn.childNodes.length == 1 && cn.firstChild.nodeType == 3) {
                    // text value
                    Add(cn.nodeName, cn.firstChild.nodeValue);
                }
                else {
                    // sub-object
                    Add(cn.nodeName, this._xmlToJson(cn));
                }
            }
        }
    
        return data;
    }
};
