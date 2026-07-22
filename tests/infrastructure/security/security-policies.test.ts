import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'yaml';

describe('Security Policies and Context Verification Tests', () => {
  it('should verify deployment.yaml enforces non-root container contexts', () => {
    const deploymentPath = path.resolve(__dirname, '../../../k8s/deployment.yaml');
    const content = fs.readFileSync(deploymentPath, 'utf8');
    const doc: any = yaml.parse(content);

    const securityContext = doc.spec.template.spec.securityContext;
    expect(securityContext.runAsNonRoot).toBe(true);
    expect(securityContext.runAsUser).toBe(1000);
  });

  it('should verify networkpolicy.yaml defines ingress and egress rules constraints', () => {
    const policyPath = path.resolve(__dirname, '../../../k8s/networkpolicy.yaml');
    const content = fs.readFileSync(policyPath, 'utf8');
    const doc: any = yaml.parse(content);

    expect(doc.spec.policyTypes).toContain('Ingress');
    expect(doc.spec.policyTypes).toContain('Egress');
  });
});
