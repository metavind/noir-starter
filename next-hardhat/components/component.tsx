import { useState, useEffect } from 'react';

import { toast } from 'react-toastify';
import Ethers from '../utils/ethers';
import React from 'react';
import { NoirBrowser } from '../utils/noir/noirBrowser';

import { ThreeDots } from 'react-loader-spinner';

const INPUT_SIZE = 2;

function Component() {
  const [input, setInput] = useState({ x: 0, y: 0});
  const [pending, setPending] = useState(false);
  const [proof, setProof] = useState(Uint8Array.from([]));
  const [verification, setVerification] = useState(false);
  const [noir, setNoir] = useState(new NoirBrowser());

  // Handles input state
  const handleChange = (e) => {
    const value = e.target.value;

    if (value.startsWith('[') && value.endsWith(']')) {
      try {
        const parsedArray = JSON.parse(value);
        
        if (Array.isArray(parsedArray) && parsedArray.every(x => Number.isInteger(x)) && parsedArray.length === INPUT_SIZE) {
          setInput(parsedArray);
          return; // exit early to prevent updating state multiple times
        }
      } catch (error) {
        // handle any parse errors if necessary
      }
    }
    
    // If we reach here, either input is not yet complete or not a valid array.
    // Update the intArray state to an empty array to reflect this.
    setInput([]);
  };

  // Calculates proof
  const calculateProof = async () => {
    setPending(true);

    try {
      const witness = await noir.generateWitness(input);
      const proof = await noir.generateProof(witness);
      setProof(proof);
    } catch (err) {
      console.log(err);
      toast.error('Error generating proof');
    }

    setPending(false);
  };

  const verifyProof = async () => {
    // only launch if we do have an acir and a proof to verify
    if (proof) {
      try {
        console.log(proof);
        const verification = await noir.verifyProof(proof);
        setVerification(verification);
        toast.success('Proof verified!');

        const ethers = new Ethers();
        const publicInputs = proof.slice(0, 32);
        const slicedProof = proof.slice(32);

        const ver = await ethers.contract.verify(slicedProof, [publicInputs]);
        if (ver) {
          toast.success('Proof verified on-chain!');
          setVerification(true);
        } else {
          toast.error('Proof failed on-chain verification');
          setVerification(false);
        }
      } catch (err) {
        console.log(err);
        toast.error('Error verifying your proof');
      } finally {
        noir.destroy();
      }
    }
  };

  // Verifier the proof if there's one in state
  useEffect(() => {
    if (proof.length > 0) {
      verifyProof();
    }
  }, [proof]);

  const initNoir = async () => {
    setPending(true);

    await noir.init();
    setNoir(noir);

    setPending(false);
  };

  useEffect(() => {
    initNoir();
  }, [proof]);

  return (
    <div className="gameContainer">
      <h1>Example starter</h1>
      <h2>This circuit checks that x and y are different</h2>
      <p>Try it!</p>
      <input name="input" type="text" placeholder="Enter numbers in format [1, 2, 3]" onChange={handleChange} value={JSON.stringify(input)} />
      <button onClick={calculateProof}>Calculate proof</button>
      {pending && <ThreeDots wrapperClass="spinner" color="#000000" height={100} width={100} />}
    </div>
  );
}

export default Component;
