import { readFileSync } from 'node:fs';

export interface PackageInfo {
  name: string;
  version: string;
  description: string;
}

/** Reads name/version/description from package.json (works from src/ and from dist/). */
function readPackageInfo(): PackageInfo {
  try {
    const pkg = JSON.parse(
      readFileSync(new URL('../../package.json', import.meta.url), 'utf8'),
    );
    return {
      name: pkg.name ?? 'product-catalog-nest-api',
      version: pkg.version ?? 'unknown',
      description: pkg.description ?? '',
    };
  } catch {
    return {
      name: 'product-catalog-nest-api',
      version: 'unknown',
      description: '',
    };
  }
}

export const packageInfo = readPackageInfo();
