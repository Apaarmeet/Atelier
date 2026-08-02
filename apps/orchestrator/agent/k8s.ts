import * as k8s from '@kubernetes/client-node';
import { Writable } from 'stream';

// Initialize the Kubernetes client using the default kubeconfig
const kc = new k8s.KubeConfig();
kc.loadFromDefault();

const cluster = kc.getCurrentCluster();

const k8sApi = kc.makeApiClient(k8s.CoreV1Api);
const exec = new k8s.Exec(kc);

const NAMESPACE = 'default';

/**
 * Creates a new Pod for the session using the base React image
 */
export async function createSandboxPod(sessionId: string): Promise<string> {
  const podName = `workspace-${sessionId.toLowerCase()}`;
  
  const podManifest: k8s.V1Pod = {
    metadata: {
      name: podName,
      labels: { app: 'lovable-workspace' }
    },
    spec: {
      containers: [
        {
          name: 'react-app',
          // You must build this image locally: docker build -t lovable-react-base:latest .
          image: 'apaarmeet/lovable-react-base:latest',
          imagePullPolicy: 'Always', // Use base tempelate
          // Keep the container running
          command: ['/bin/sh', '-c', 'sleep infinity'],
          workingDir: '/app',
          ports: [{ containerPort: 5173 }]
        }
      ],
      restartPolicy: 'Never'
    }
  };

  try {
    await k8sApi.createNamespacedPod({
      namespace: NAMESPACE,
      body: podManifest,
    });
    console.log(`Pod ${podName} created. Waiting for it to be ready...`);
    
    // Simple polling to wait for the pod to be running
    let isRunning = false;
    while (!isRunning) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const res = await k8sApi.readNamespacedPodStatus({
        name: podName,
        namespace: NAMESPACE,
      });
      if (res.status?.phase === 'Running' || res.status?.phase === 'Running' /* Sometimes body is flat */ || (res as any).body?.status?.phase === 'Running') {
        // Handle varying response structures in different client-node versions
        isRunning = true;
      }
    }
    
    // Start the dev server in the background
    await execCommandInPod(podName, ['bun', 'run', 'dev', '--host', '0.0.0.0']);
    
    return podName;
  } catch (err) {
    console.error("Error creating sandbox pod:", err);
    throw err;
  }
}

import { spawn } from 'child_process';

/**
 * Forwards the pod's port 5173 to a random available port on localhost.
 * Returns the mapped localhost port number.
 */
export async function forwardPodPort(podName: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const pf = spawn('kubectl', ['port-forward', `pod/${podName}`, ':5173']);
    
    pf.stdout.on('data', (data) => {
      const output = data.toString();
      const match = output.match(/Forwarding from 127\.0\.0\.1:(\d+)/);
      if (match) {
        console.log(`Port forwarded: localhost:${match[1]} -> ${podName}:5173`);
        resolve(parseInt(match[1], 10));
      }
    });

    pf.stderr.on('data', (data) => {
      // kubectl port-forward sometimes logs normal connection info to stderr,
      // so we don't reject here unless the process actually errors out.
      console.log(`[Port-Forward] ${podName}: ${data.toString().trim()}`);
    });

    pf.on('error', (err) => {
      console.error(`Port forward failed for ${podName}:`, err);
      reject(err);
    });
  });
}

/**
 * Executes a bash command inside the specified Pod
 */
export async function execCommandInPod(podName: string, command: string[]): Promise<{ stdout: string, stderr: string }> {
  let stdoutData = '';
  let stderrData = '';

  const outStream = new Writable({
    write(chunk, encoding, callback) {
      stdoutData += chunk.toString();
      callback();
    }
  });

  const errStream = new Writable({
    write(chunk, encoding, callback) {
      stderrData += chunk.toString();
      callback();
    }
  });

  return new Promise(async (resolve, reject) => {
    try {
      await exec.exec(
        NAMESPACE,
        podName,
        'react-app', // container name
        command,
        outStream,
        errStream,
        null, // stdin
        false /* tty */,
        (status: k8s.V1Status) => {
          // Status callback when command finishes
          if (status.status === 'Success') {
            resolve({ stdout: stdoutData, stderr: stderrData });
          } else {
            reject(new Error(`Command failed: ${stderrData}`));
          }
        }
      );
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Reads a file from the Pod
 */
export async function readFileFromPod(podName: string, filePath: string): Promise<string> {
  const result = await execCommandInPod(podName, ['cat', filePath]);
  return result.stdout;
}

/**
 * Writes a file to the Pod
 */
export async function writeFileToPod(podName: string, filePath: string, content: string): Promise<void> {
  // Use base64 encoding to avoid bash escaping issues
  const base64Content = Buffer.from(content).toString('base64');
  await execCommandInPod(podName, ['/bin/sh', '-c', `echo "${base64Content}" | base64 -d > "${filePath}"`]);
}

/**
 * Deletes the Pod when the session ends
 */
export async function deleteSandboxPod(podName: string): Promise<void> {
  try {
    await k8sApi.deleteNamespacedPod({
      name: podName,
      namespace: NAMESPACE
    });
    console.log(`Pod ${podName} deleted.`);
  } catch (err) {
    console.error(`Failed to delete pod ${podName}:`, err);
  }
}
