declare module 'qiniu' {
  export namespace auth {
    export namespace digest {
      export class Mac {
        constructor(accessKey: string, secretKey: string);
      }
    }
  }

  export namespace conf {
    export class Config {
      zone?: any;
    }
  }

  export namespace zone {
    export const Zone_z0: any;
    export const Zone_z1: any;
    export const Zone_z2: any;
    export const Zone_na0: any;
    export const Zone_as0: any;
  }

  export namespace rs {
    export class BucketManager {
      constructor(mac: auth.digest.Mac, config: conf.Config);
      delete(bucket: string, key: string, callback: (err: any, body: any, info: any) => void): void;
    }

    export class PutPolicy {
      scope: string;
      returnBody?: string;
      constructor(options: { scope: string });
      uploadToken(mac: auth.digest.Mac): string;
    }
  }

  export namespace form_up {
    export class FormUploader {
      constructor(config: conf.Config);
      put(uploadToken: string, key: string, data: Buffer, putExtra: PutExtra, callback: (err: any, body: any, info: any) => void): void;
    }

    export class PutExtra {
      mimeType?: string;
    }
  }
}
