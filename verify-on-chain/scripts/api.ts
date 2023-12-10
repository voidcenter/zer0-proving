import * as fs from 'fs';
import {
    AddImageParams,
    ProvingParams,
    WithSignature,
    QueryParams,
    PaginationResult,
    Task,
    ZkWasmUtil,
    ZkWasmServiceHelper,
    Image,
} from "zkwasm-service-helper";
import BN from "bn.js";
import assert from 'assert';
import { config as dotEnvConfig } from "dotenv";
dotEnvConfig();


const address = process.env.WALLET_ADDRESS;
const private_key = process.env.WALLET_PRIVATE_KEY;


export function delay(ms: number) {
    return new Promise( resolve => setTimeout(resolve, ms) );
}


// return md5
export async function submit_wasm(wasm_file_name: string, circuit_size: number): Promise<string> {
    const endpoint = "https://rpc.zkwasmhub.com:8090";
    let helper = new ZkWasmServiceHelper(endpoint, "", "");
    let fileSelected: Buffer = fs.readFileSync(wasm_file_name);
    let md5 = ZkWasmUtil.convertToMd5(fileSelected as Uint8Array);
    // console.log(fileSelected);  
    // console.log(md5);

    let info: AddImageParams = {
            name: fileSelected.toString(),
            image_md5: md5,
            image: fileSelected,
            user_address: address!.toLowerCase(),
            description_url: "",
            avator_url: "",
            circuit_size,
          };
    
    let msg = ZkWasmUtil.createAddImageSignMessage(info);
    let signature: string = await ZkWasmUtil.signMessage(msg, private_key!); //Need user private key to sign the msg
    let task: WithSignature<AddImageParams> = {
        ...info,
        signature,
    };
          
    let response = await helper.addNewWasmImage(task);

    console.log('response = ', response);
    return md5;
}



export async function query_image(md5: string): Promise<Image> {
    const endpoint = "https://rpc.zkwasmhub.com:8090";
    const helper = new ZkWasmServiceHelper(endpoint, "", "");
    const image = await helper.queryImage(md5);
    console.log('image = ', image);
    return image;
}




// return task id
export async function submit_proving_task
        (md5: string, public_inputs: string[], private_inputs: string[]): 
        Promise<string> {
    const endpoint = "https://rpc.zkwasmhub.com:8090";

    let helper = new ZkWasmServiceHelper(endpoint, "", "");

    let info: ProvingParams = {
        user_address: address!.toLowerCase(),
        md5: md5,
        public_inputs,
        private_inputs,
    };
    let msgString = ZkWasmUtil.createProvingSignMessage(info);

    let signature: string;
    try {
        signature = await ZkWasmUtil.signMessage(msgString, private_key!);
    } catch (e: unknown) {
        console.log("error signing message", e);
        return '';
    }

    let task: WithSignature<ProvingParams> = {
        ...info,
        signature: signature,
    };
    let response = await helper.addProvingTask(task);
    console.log(response);

    return response.id;
}



export async function query_proving_task(id: string): Promise<Task> {
    const endpoint = "https://rpc.zkwasmhub.com:8090";
    const url = `${endpoint}/tasks?id=${id}`
    // console.log(url);
    const response = await fetch(url.toString());
    const data = await response.json();
    // console.log(data);
    // return response.result.data[0];
    return (data as any).result.data[0];
}



export function print_proving_task(task: Task) {
    let aggregate_proof = ZkWasmUtil.bytesToBN(task.proof);
    let instances = ZkWasmUtil.bytesToBN(task.instances);
    let batchInstances = ZkWasmUtil.bytesToBN(task.batch_instances);
    let aux = ZkWasmUtil.bytesToBN(task.aux);
    let fee = task.task_fee && ZkWasmUtil.convertAmount(task.task_fee); 

    console.log("Task details: ");
    console.log("    ", task);
    console.log("    proof:");

    aggregate_proof.map((proof: BN, index) => {
        console.log("   0x", proof.toString("hex"));
    });

    console.log("    batch_instacne:");
    batchInstances.map((ins: BN, index) => {
        console.log("   0x", ins.toString("hex"));
    });

    console.log("    instacne:");
    instances.map((ins: BN, index) => {
        console.log("   0x", ins.toString("hex"));
    });

    console.log("    aux:");
    aux.map((aux: BN, index) => {
        console.log("   0x", aux.toString("hex"));
    });

    console.log("   fee:", fee);
}





export async function prove
        (md5: string, public_inputs: string[], private_inputs: string[]): 
        Promise<Task> {
    const id = await submit_proving_task(md5, public_inputs, private_inputs);

    let task;

    const ts = Date.now();
    while (true) {
        await delay(1000);
        console.log('waiting for proving to finish ...');
        task = await query_proving_task(id);
        if (task.status == 'Done') {
            break;
        }

        if (task.status != 'Pending' && task.status != 'Processing') {
            console.log('proving failed', task.status);
            break;
        }
    }

    print_proving_task(task);
    console.log('proving took', (Date.now() - ts) / 1000, 'secs');
    return task;
}




export async function wait_for_proving_tasks(ids: string[]): Promise<Task[]> {

    const ts = Date.now();

    const nt = ids.length;
    const status: (string | null)[] = Array(nt).fill(null);
    const tasks: (Task | null)[] = Array(nt).fill(null);

    while (true) {
        await delay(1000);
        console.log('waiting for proving to finish ...');

        const flags: number[] = await Promise.all(
            status.map(async (st, idx) => {
                if (st) {
                    return 1;
                }

                const task = await query_proving_task(ids[idx]);
                if (task.status === 'Done') {
                    status[idx] = 'Done';
                    tasks[idx] = task;
                    return 1;
                }
                if (task.status != 'Pending' && task.status != 'Processing') {  
                    status[idx] = task.status;
                    return 1;
                }          
                return 0;
            }
        ));
        const finished = flags.reduce((s, x) => s + x, 0);

        if (finished === nt) {
            break;
        }
    }

    console.log('task status = ', status);
    console.log('proving took', (Date.now() - ts) / 1000, 'secs');
    return tasks as Task[];
}



