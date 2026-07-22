import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'yaml';

describe('Kubernetes Manifests YAML Validation Tests', () => {
  const k8sDir = path.resolve(__dirname, '../../../k8s');

  const files = [
    'namespace.yaml',
    'configmap.yaml',
    'secrets.yaml',
    'deployment.yaml',
    'statefulset-worker.yaml',
    'service.yaml',
    'service-worker.yaml',
    'ingress.yaml',
    'hpa.yaml',
    'hpa-worker.yaml',
    'pdb.yaml',
    'networkpolicy.yaml',
    'storageclass.yaml',
    'postgres-deployment.yaml',
    'redis-deployment.yaml',
  ];

  files.forEach((file) => {
    it(`should verify ${file} exists and contains valid Kubernetes YAML syntax`, () => {
      const filePath = path.join(k8sDir, file);
      expect(fs.existsSync(filePath)).toBe(true);

      const content = fs.readFileSync(filePath, 'utf8');
      const docs = yaml.parseAllDocuments(content).map((doc) => doc.toJS() as any);

      expect(docs.length).toBeGreaterThan(0);
      docs.forEach((doc: any) => {
        if (doc) {
          expect(doc).toHaveProperty('apiVersion');
          expect(doc).toHaveProperty('kind');
        }
      });
    });
  });
});
