import { config as dotEnvConfig } from "dotenv";
import { query_proving_task } from './api';
import { ethers, JsonRpcProvider } from "ethers";
import { ZkWasmUtil } from "zkwasm-service-helper";
const verifier_abi = require('./verifier_abi.json');
dotEnvConfig();



// the main flow and loop 
async function main() {
    // const id = '657055e4f76bb58957128fae';
    // const verifier_addr = '0x486842E5B937eBBA30fC0ae9e9D6884F7B376E9C';

    const id = '65745401d9626b25e9854bdb';
    const verifier_addr = '0x83c0Fb193b2234bFd3e7862412b9Ce0ADf04a29e';
    const task = await query_proving_task(id);


    // verify proof on-chain 
    const provider = new JsonRpcProvider(process.env.GOERLI_RPC);
    const contract = new ethers.Contract(
        verifier_addr,
        verifier_abi,
        provider
    ) 
    
    // function verify (
    //     uint256[] calldata proof,
    //     uint256[] calldata verify_instance,
    //     uint256[] calldata aux,
    //     uint256[][] calldata target_instance
    // ) external view;

    let result = await contract.verify(
        ZkWasmUtil.bytesToBigIntArray(task.proof),
        ZkWasmUtil.bytesToBigIntArray(task.batch_instances),
        ZkWasmUtil.bytesToBigIntArray(task.aux),
        [ZkWasmUtil.bytesToBigIntArray(task.instances)]
    );

    console.log('results = ', result);
}


main()
    .then(() => process.exit(0))    
    .catch((error) => {
        console.error(error);
        process.exitCode = 1;
    });


