# NFS-e SP Bridge

Aplicação desenvolvida em Node para servir de ponte entre sua aplicação 
e o Web Service da prefeitura de SP para automatização do processo de 
emissão, consulta e cancelamento de NF-e.

[NFE São Paulo](https://nfe.prefeitura.sp.gov.br/)
[Manual de utilização do Web Service](http://notadomilhao.prefeitura.sp.gov.br/cidadao/informacoes-gerais/manuais-arquivos/nfe_web_service.pdf/view)

## Configuração

Preencha as informações necessárias da sua empresa no arquivo `config.js` 
na raiz da aplicação:

- **cnpj**: CNPJ (Cadastro Nacional da Pessoa Jurídica);
- **incricaoMunicipal**: Inscrição Municipal;

Para efetuar a comunicação com o serviço da prefeitura de SP é necessário 
que você já tenha o arquivo com o certificado A1 para sua empresa.

Com o arquivo do certificado em mãos será necessário gerar dois arquivos 
com as chaves que seram utilizadas na comunicação: `cert.pem` e `key.pem`.

Supondo que o seu certificado esteja com o nome `meucertificado.pfx` a 
criação das chaves podem ser feitas com os seguintes comandos:

Gerando arquivo `cert.pem`:

```
openssl pkcs12 -in meucertificado.pfx -clcerts -nokeys -out cert.pem
```

Gerando arquivo `key.pem`:

```
openssl pkcs12 -in meucertificado.pfx -nocerts -out key.pem
```

Com os dois aqruivos gerados é só mover os mesmos para pasta ssl na raiz 
da aplicação.

## Execução

A versão do `Node` necessária é a `8.5.0.`. Com o Node instalado é necessário 
instalar as dependências da aplicação:

```
npm install
```

E inicar o serviço:

```
npm start
```

Para que o serviço não seja finalizado você pode utilizar forever.

Instalando forever globalmente:

```
npm install -g forever
```

Rodando aplicação com forever:

```
forever start server.js
```

## Endpoints

Todos endpoints recebem um JSON como requisição. Cada uma dessas requisições 
pode ter adicionado um atributo do tipo objeto chamado `attachments` que pode 
conter um atributo chamado `webhook` para os casos em que se queira receber 
a resposta em um webhook próprio via POST. Nesse objeto podem ser adicionado 
também qualquer dado que tenha que ser retornado para o webhook mencionado. 
Exemplo: ID do registro RPS na tabela do sistema de origem.

```
{
  "attachments": {
    "webhook": "https://meuwebhook.com",
    "umaInfoQualquer": "Lorem Ipsum"
  }
}
```

Seguem os endpoints disponíveis:

### Consulta NFE

Endpoint: 

**/api/ConsultaNFe**

Exemplo de requisição:

```
{
  "serieRps": "1",
  "numeroRps": "123"
}
```

### Envio Lote RPS

Endpoint: 

**/api/EnvioLoteRPS**

Exemplo de requisição:

```
{
  "transacao": false,
  "dtInicio": "2018-12-23",
  "dtFim": "2018-12-23",
  "qtdRps": "1",
  "valorTotalServicos": "200.99",
  "valorTotalDeducoes": "0",
  "rps": [{
    "serieRps": "1",
    "numeroRps": "123",
    "dataEmissao": "2018-12-23",
    "valorServicos": "200.99",
    "discriminacao": "Discriminação dos serviços",
    "statusRps": "Discriminação dos serviços",
    "tributacaoRps": "T",
    "valorDeducoes": "0",
    "codigoServico": "6912",
    "issRetido": false,
    "tomador": {
      "cpf": "12312312312",
      "razaoSocial": "Empresa do meu cliente",
      "email": "xxx@yyy.com",
      "endereco": {
        "tipoLogradouro": "Rua",
        "logradouro": "Araucária",
        "numero": "123",
        "complemento": "Apto 201",
        "bairro": "Serraria",
        "cidade": "12345",
        "uf": "SC",
        "cep": "88123123"
      }
    }
  }]
}
```

### Envio RPS

Endpoint: 

**/api/EnvioRPS**

Exemplo de requisição:

```
{
  "serieRps": "1",
  "numeroRps": "123",
  "dataEmissao": "2018-12-23",
  "valorServicos": "200.99",
  "discriminacao": "Discriminação dos serviços",
  "statusRps": "Discriminação dos serviços",
  "tributacaoRps": "T",
  "valorDeducoes": "0",
  "codigoServico": "6912",
  "issRetido": false,
  "tomador": {
    "cpf": "12312312312",
    "razaoSocial": "Empresa do meu cliente",
    "email": "xxx@yyy.com",
    "endereco": {
      "tipoLogradouro": "Rua",
      "logradouro": "Araucária",
      "numero": "123",
      "complemento": "Apto 201",
      "bairro": "Serraria",
      "cidade": "12345",
      "uf": "SC",
      "cep": "88123123"
    }
  }
}
```