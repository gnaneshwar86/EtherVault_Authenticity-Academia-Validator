// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title EtherVault
 * @dev Academic Certificate Verification System with Traceability
 */
contract EtherVault {
    address public owner;
    
    // Mapping to store authorized institutions
    mapping(address => bool) public authorizedInstitutions;
    
    // Mapping to store certificate hashes and the institution that issued them
    mapping(bytes32 => address) public certificateIssuers;
    
    // Events for traceability and audit
    event InstitutionAuthorized(address indexed institution);
    event InstitutionRevoked(address indexed institution);
    event CertificateHashStored(bytes32 indexed hash, address indexed institution);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    
    modifier onlyAuthorized() {
        require(authorizedInstitutions[msg.sender], "Only authorized institutions can call this function");
        _;
    }
    
    constructor() {
        owner = msg.sender;
        authorizedInstitutions[msg.sender] = true;
    }
    
    /**
     * @dev Authorize a new institution
     */
    function authorizeInstitution(address institution) public onlyOwner {
        authorizedInstitutions[institution] = true;
        emit InstitutionAuthorized(institution);
    }
    
    /**
     * @dev Revoke institution's authorization
     */
    function revokeInstitution(address institution) public onlyOwner {
        authorizedInstitutions[institution] = false;
        emit InstitutionRevoked(institution);
    }
    
    /**
     * @dev Store a certificate hash with issuer traceability
     */
    function storeCertificateHash(bytes32 hash) public onlyAuthorized {
        require(certificateIssuers[hash] == address(0), "Certificate hash already exists");
        
        certificateIssuers[hash] = msg.sender;
        emit CertificateHashStored(hash, msg.sender);
    }
    
    /**
     * @dev Verify if a certificate hash exists and return the issuer
     */
    function verifyCertificateHash(bytes32 hash) public view returns (bool exists, address issuer) {
        address foundIssuer = certificateIssuers[hash];
        return (foundIssuer != address(0), foundIssuer);
    }
}
