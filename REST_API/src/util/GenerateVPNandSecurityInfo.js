'use strict';

/** Generate VPN and Privacy, Security related training info
 * @input user 
 */
const generateVPNandSecurityInfo = (entry) => {
    let memberOf = entry.memberOf;
    //let privacy_comp = entry.NIHPrivacyAwarenessCompDate;
    let privacy_refresh = entry.PrivacyAwarenessRefresherCompDate;
    //let security_comp = entry.NIHInformationSecurityAwarenessCompDate;
    let security_refresh = entry.InformationSecurityRefresherCompDate;
    
    //check VPN access
    let vpn_result = false;
    if(memberOf){
        memberOf.forEach( member => {
            if (member.indexOf("CN=NIH Grant-VPN") >= 0) {
                vpn_result = true;
            }
        });
    }

    //fetch out latest training refresh date
    let privacy_refresh_result = "";
    let security_refresh_result = "";
    if(Array.isArray(privacy_refresh)){
        privacy_refresh.sort(function(a, b){
            return new Date(b) - new Date(a);
        });
        privacy_refresh_result = privacy_refresh[0];
    }
    

    if(Array.isArray(security_refresh)){
        security_refresh.sort(function(a, b){
            return new Date(b) - new Date(a);
        });
        security_refresh_result = security_refresh[0];
    }

    entry.NIHVPNRemoteAccess = vpn_result;
    entry.PrivacyAwarenessRefresherCompDate = privacy_refresh_result;
    entry.InformationSecurityRefresherCompDate = security_refresh_result;

};

module.exports = { generateVPNandSecurityInfo };