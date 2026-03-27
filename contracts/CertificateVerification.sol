// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title CertificateVerification
 * @notice Decentralized certificate issuance and verification on-chain.
 *         Universities register as issuers, upload certificate hashes,
 *         and employers can verify certificates instantly.
 */
contract CertificateVerification {
    // ── Types ──────────────────────────────────────────────────────────
    enum CertStatus {
        None,
        Active,
        Revoked
    }

    struct Certificate {
        bytes32 certHash;       // keccak256(certificate file bytes)
        string  ipfsCid;        // IPFS content identifier
        address issuer;         // university / institution
        address recipient;      // student wallet
        string  studentName;
        string  courseName;
        uint256 issuedAt;
        CertStatus status;
    }

    // ── State ──────────────────────────────────────────────────────────
    address public owner;

    /// certId → Certificate
    mapping(bytes32 => Certificate) public certificates;

    /// address → authorised issuer?
    mapping(address => bool) public authorisedIssuers;

    /// List of all certificate IDs for enumeration
    bytes32[] public certificateIds;

    // ── Events ─────────────────────────────────────────────────────────
    event IssuerAdded(address indexed issuer);
    event IssuerRemoved(address indexed issuer);
    event CertificateIssued(
        bytes32 indexed certId,
        address indexed issuer,
        address indexed recipient,
        string  ipfsCid
    );
    event CertificateRevoked(bytes32 indexed certId, address indexed issuer);

    // ── Modifiers ──────────────────────────────────────────────────────
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    modifier onlyIssuer() {
        require(authorisedIssuers[msg.sender], "Not an authorised issuer");
        _;
    }

    // ── Constructor ────────────────────────────────────────────────────
    constructor() {
        owner = msg.sender;
    }

    // ── Admin functions ────────────────────────────────────────────────
    function addIssuer(address _issuer) external onlyOwner {
        require(_issuer != address(0), "Zero address");
        authorisedIssuers[_issuer] = true;
        emit IssuerAdded(_issuer);
    }

    function removeIssuer(address _issuer) external onlyOwner {
        authorisedIssuers[_issuer] = false;
        emit IssuerRemoved(_issuer);
    }

    // ── Issue a certificate ────────────────────────────────────────────
    function issueCertificate(
        bytes32 _certHash,
        string  calldata _ipfsCid,
        address _recipient,
        string  calldata _studentName,
        string  calldata _courseName
    ) external onlyIssuer returns (bytes32 certId) {
        require(_recipient != address(0), "Zero recipient");
        require(bytes(_ipfsCid).length > 0, "Empty IPFS CID");

        certId = keccak256(
            abi.encodePacked(_certHash, msg.sender, _recipient, block.timestamp)
        );
        require(
            certificates[certId].status == CertStatus.None,
            "Certificate ID collision"
        );

        certificates[certId] = Certificate({
            certHash:    _certHash,
            ipfsCid:     _ipfsCid,
            issuer:      msg.sender,
            recipient:   _recipient,
            studentName: _studentName,
            courseName:  _courseName,
            issuedAt:    block.timestamp,
            status:      CertStatus.Active
        });

        certificateIds.push(certId);

        emit CertificateIssued(certId, msg.sender, _recipient, _ipfsCid);
    }

    // ── Revoke a certificate ───────────────────────────────────────────
    function revokeCertificate(bytes32 _certId) external onlyIssuer {
        Certificate storage cert = certificates[_certId];
        require(cert.status == CertStatus.Active, "Not active");
        require(cert.issuer == msg.sender, "Not the issuer");

        cert.status = CertStatus.Revoked;
        emit CertificateRevoked(_certId, msg.sender);
    }

    // ── Verification (view) ────────────────────────────────────────────
    function verifyCertificate(bytes32 _certId)
        external
        view
        returns (
            bool   valid,
            string memory studentName,
            string memory courseName,
            address issuer,
            address recipient,
            string memory ipfsCid,
            uint256 issuedAt
        )
    {
        Certificate storage cert = certificates[_certId];
        valid = cert.status == CertStatus.Active;
        studentName = cert.studentName;
        courseName  = cert.courseName;
        issuer      = cert.issuer;
        recipient   = cert.recipient;
        ipfsCid     = cert.ipfsCid;
        issuedAt    = cert.issuedAt;
    }

    /// Verify by file hash – useful when employer only has the file
    function verifyCertificateByHash(bytes32 _certHash)
        external
        view
        returns (bytes32 certId, bool found)
    {
        for (uint256 i = 0; i < certificateIds.length; i++) {
            if (certificates[certificateIds[i]].certHash == _certHash) {
                return (certificateIds[i], true);
            }
        }
        return (bytes32(0), false);
    }

    function getCertificateCount() external view returns (uint256) {
        return certificateIds.length;
    }
}
