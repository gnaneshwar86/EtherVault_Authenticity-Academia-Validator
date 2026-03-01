// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract EtherVault {

    struct Documents {
        string aadharHash;
    }

    struct MultiSig {
        address institute;
        address student;
        Documents documents;
    }

    mapping(address => MultiSig) public wallets;

    event InstituteLinked(address indexed student, address indexed institute);
    event DocumentUploaded(address indexed student, string hash);

    function createNewMultiSigbyUser(address _institute) public {
        require(_institute != address(0), "Invalid institute address");

        wallets[msg.sender].institute = _institute;
        wallets[msg.sender].student = msg.sender;

        emit InstituteLinked(msg.sender, _institute);
    }

    function uploadAadhar(string memory _hash) public {
        require(bytes(_hash).length > 0, "Empty hash");

        wallets[msg.sender].documents.aadharHash = _hash;

        emit DocumentUploaded(msg.sender, _hash);
    }

    function getAadhar(address _student) public view returns (string memory) {
        return wallets[_student].documents.aadharHash;
    }
}