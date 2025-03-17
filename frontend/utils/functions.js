import { ethers } from "ethers";
import { contractABI, contractAddress } from "./constants";

export const connectWithProdider = async () => {
    try {
        if (!window.ethereum) {
            throw new Error("MetaMask non détecté !");
        }
        const provider = new ethers.BrowserProvider(window.ethereum);
        const contractInstance = new ethers.Contract(contractAddress, contractABI, provider);
        const owner = await contractInstance.owner();
        // console.log("✅ Contrat connecté :", contractInstance);

        return {contractInstance, provider, owner};
    } catch(error) {
        console.error("❌ Erreur de connexion au contrat :", error);
        return null;
    }
}

export const connectWithSigner = async () => {
    try {
        if (!window.ethereum) {
            throw new Error("MetaMask non détecté !");
        }
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const contractInstance = new ethers.Contract(contractAddress, contractABI, signer);
        // console.log("✅ Contrat connecté :", contractInstance);
        
        return { contractInstance, signer, provider };
    } catch(error) {
        console.error("❌ Erreur de connexion au signer :", error);
        return null;
    }
}


export const checkIsOwner = async (address) => {
    const { owner } = await connectWithProdider();
    return owner.toLowerCase() === address.toLowerCase();
}




