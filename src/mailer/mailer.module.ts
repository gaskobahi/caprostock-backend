import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { MailerSenderService } from './services/mailer.service';
@Module({
  imports: [
    MailerModule.forRoot({
      transport: {
        host:'smtp.gmail.com',
        port:465,
        secure: true,
        ignoreTLS: true,
        auth: {
          user: process.env.APP_EMAIL_USER??'bahiboris@gmail.com',
          pass: process.env.APP_EMAIL_PASSWORD??'pysn hjpu kbkd cmry',
        },
        /*tls: {
          ciphers: 'TLS_AES_128_GCM_SHA256:TLS_AES_256_GCM_SHA384:TLS_CHACHA20_POLY1305_SHA256',
          minVersion: 'TLSv1.2',
          maxVersion: 'TLSv1.3',
        },*/
      },
      defaults: {
        from: '"BAHI BORIS" <support@gmail.com>',
      },
      template: {
        dir: process.cwd() + '/templates/',
        adapter: new HandlebarsAdapter(), // You can use other template engines like Pug or EJS
        options: {
          strict: true,
        },
      },
    }),
  ],
  providers: [MailerSenderService],
  exports: [MailerSenderService],
})
export class MailModule {}
