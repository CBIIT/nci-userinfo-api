var express = require('express');
var excelApiRouter = express.Router();
var RestClient = require('node-rest-client').Client;
var Excel = require('exceljs');

var restClient = new RestClient();

var CLOSING_STAGE_MAP =
    {
        'not_closing': 'Not Closing',
        'considering': 'Considering',
        'closing_inventory': 'Closing - 1. Inventory',
        'closing_application_mapping': 'Closing - 2. Application Mapping',
        'closing_migration_planning': 'Closing - 3. Migration Planning',
        'closing_migration_execution': 'Closing - 4. Migration Execution',
        'closing_equipment_removal': 'Closing - 5. Equipment Removal',
        'closed': 'Closed'
    }; 


var router = function (logger, config) {

    excelApiRouter.route('/UtilizationReport/fiscalyear/:year/quarter/:quarter')
        .get(function (req, res) {
            var args = {

                parameters: { year: req.params.year, quarter: req.params.quarter },
                headers: {
                    'Content-Type': 'application/json'
                }
            };

            restClient.get(config.sn.utilizationURL, args, function (data, response) {

                var resultArr = data.result;

                var resultMap = {};

                // The available FTEs for server support
                var totalServerFTEs = 0;

                // The available FTEs for data center managementG
                var totalDcmFTEs = 0;

                // The available FTEs for storage
                var totalStorageFTEs = 0;

                // max variables used to determine biggest user data center for the resources electricity, storage and server count
                var maxServerCount = 0;
                var maxStorageAvailability = 0.0;
                var maxElectricityUsage = 0.0;

                var biggestServerUser, biggestElectricityUser, biggestStorageUser;

                // total resource counts among all data centers
                var totalServerCount = 0;
                var totalStorageAvailability = 0.0;
                var totalElectricityUsage = 0.0;

                // first loop to get available FTEs and determine biggest user of electricity, storage and servers 
                resultArr.forEach(function (o) {

                    var dataCenterName = o.u_data_center_name;

                    // Totals, Storage, Server, Data Center Management 
                    var category = o.u_data_call.split(' - ')[1].trim();

                    if (category === 'Totals') {
                        // Ignore records with totals for this calculation.
                        return;
                    }

                    dataCenterName = getDataCenterName(dataCenterName, category);

                    // Do not rely on ATC and TE21 to fetch total CBIIT FTEs - they have their own FTEs
                    if (category != 'Totals' && dataCenterName !== 'atc_warehouse' && dataCenterName !== 'atc-dcm' && dataCenterName !== 'atc-dceg' && dataCenterName != '9609mc_te21' && dataCenterName != '9609mc_te21-ccr' && dataCenterName != '9609mc_te21-dea') {
                        if (totalServerFTEs == 0 && category === 'Server') {
                            totalServerFTEs = parseInt(o.u_total_ftes);
                        } else if (totalDcmFTEs == 0 && category === 'Data Center Management') {
                            totalDcmFTEs = parseInt(o.u_total_ftes);
                        } else if (totalStorageFTEs == 0 && category === 'Storage') {
                            totalStorageFTEs = parseInt(o.u_total_ftes);
                        }
                    }

                    var electricityUsage = 0.0;
                    if (o.u_average_it_electricity_usage) {
                        electricityUsage = parseFloat(o.u_average_it_electricity_usage);

                    }

                    totalElectricityUsage += electricityUsage;

                    if (electricityUsage > maxElectricityUsage) {
                        biggestElectricityUser = dataCenterName;
                        maxElectricityUsage = electricityUsage;
                    }

                    var storageAvailability = 0.0;
                    if (o.u_total_storage) {
                        storageAvailability = parseFloat(o.u_total_storage);
                    }

                    totalStorageAvailability += storageAvailability;

                    if (storageAvailability > maxStorageAvailability) {
                        biggestStorageUser = dataCenterName;
                        maxStorageAvailability = storageAvailability;
                    }

                    var serverCount = 0;
                    if (o.u_total_windows_servers) {
                        serverCount += parseInt(o.u_total_windows_servers);
                    }
                    if (o.u_total_other_servers) {
                        serverCount += parseInt(o.u_total_other_servers);
                    }
                    if (o.u_total_mainframes) {
                        serverCount += parseInt(o.u_total_mainframes);
                    }
                    if (o.u_total_hpc_cluster_nodes) {
                        serverCount += parseInt(o.u_total_hpc_cluster_nodes);
                    }
                    if (o.u_total_virtual_hosts) {
                        serverCount += parseInt(o.u_total_virtual_hosts);
                    }
                    if (o.u_total_virtual_os) {
                        serverCount += parseInt(o.u_total_virtual_os);
                    }

                    totalServerCount += serverCount;

                    if (serverCount > maxServerCount) {
                        biggestServerUser = dataCenterName;
                        maxServerCount = serverCount;
                    }


                });
                console.log('Total data center FTEs: ' + totalDcmFTEs);
                console.log('Total storage FTEs: ' + totalStorageFTEs);
                console.log('Total server FTEs: ' + totalServerFTEs);
                console.log('Total electricity usage: ' + totalElectricityUsage);
                console.log('Total storage availability: ' + totalStorageAvailability);
                console.log('Total server count: ' + totalServerCount);
                console.log('Biggest electricity user: ' + biggestElectricityUser);
                console.log('Biggest storage user: ' + biggestStorageUser);
                console.log('Biggest server user: ' + biggestServerUser);

                var remainingDcmFTEs = totalDcmFTEs;
                var remainingStorageFTEs = totalStorageFTEs;
                var remainingServerFTEs = totalServerFTEs;

                // second loop to process utilization for each data center and store in a data center map
                resultArr.forEach(function (o) {

                    var dataCenterName = o.u_data_center_name;
                    var category = o.u_data_call.split(' - ')[1].trim();

                    dataCenterName = getDataCenterName(dataCenterName, category);

                    if (!resultMap.hasOwnProperty(dataCenterName)) {
                        console.log('creating key ' + dataCenterName);
                        resultMap[dataCenterName] = {
                            u_ic: 'NCI',
                            u_data_call: o.u_data_call.split(' - ')[0].trim(),
                            u_average_it_electricity_usage: 0.0,
                            u_automated_monitoring: 'no',
                            u_server_utilization: 0.0,
                            u_total_ftes: 0,
                            u_rack_count: 0,
                            u_total_mainframes: 0,
                            u_total_windows_servers: 0,
                            u_total_hpc_cluster_nodes: 0,
                            u_total_other_servers: 0,
                            u_total_virtual_hosts: 0,
                            u_total_virtual_os: 0,
                            u_total_storage: 0.0,
                            u_used_storage: 0.0,
                            u_closing_stage: o.u_closing_stage,
                            u_closing_on_fiscal_year: o.u_closing_on_fiscal_year,
                            u_closing_on_quarter: o.u_closing_on_quarter,
                            u_closing_fiscal_year: o.u_closing_fiscal_year,
                            u_closing_quarter: o.u_closing_quarter
                        };
                    }

                    if (category === 'Totals') {
                        // Only get the closing stage information from totals. The rest should come from the children records with categories 'Server', 'Storage', 'Data Center Management'
                        resultMap[dataCenterName].u_closing_stage = CLOSING_STAGE_MAP[o.u_closing_stage] || o.u_closing_stage;
                        resultMap[dataCenterName].u_closing_on_quarter =  o.u_closing_on_quarter ? 'Q' + o.u_closing_on_quarter : '';
                        resultMap[dataCenterName].u_closing_on_fiscal_year = o.u_closing_on_fiscal_year;


                        return;
                    }

                    if (o.u_average_it_electricity_usage) {
                        resultMap[dataCenterName].u_average_it_electricity_usage += parseFloat(o.u_average_it_electricity_usage);
                    }

                    if (o.u_automated_monitoring) {
                        resultMap[dataCenterName].u_automated_monitoring = o.u_automated_monitoring;
                    }

                    if (o.u_server_utilization) {
                        resultMap[dataCenterName].u_server_utilization += parseFloat(o.u_server_utilization);
                    }

                    // Data center FTE assignment
                    if (dataCenterName === 'atc-dceg' || dataCenterName === '9609mc_te21-ccr' || dataCenterName === '9609mc_te21-dea') {
                        if (o.u_total_ftes) {
                            resultMap[dataCenterName].u_total_ftes += parseFloat(o.u_total_ftes);
                        }
                    } else {
                        switch (category) {
                            case 'Data Center Management':
                                if (dataCenterName !== biggestElectricityUser) {
                                    var elUsage = parseFloat(o.u_average_it_electricity_usage);
                                    var elRatio = elUsage / totalElectricityUsage;
                                    var proratedDcmFTEs = totalDcmFTEs * elRatio;
                                    resultMap[dataCenterName].u_total_ftes += proratedDcmFTEs;
                                    remainingDcmFTEs -= proratedDcmFTEs;
                                }
                                break;
                            case 'Storage':
                                if (dataCenterName !== biggestStorageUser) {
                                    var storageUsage = parseFloat(o.u_used_storage);
                                    var storageRatio = storageUsage / totalStorageAvailability;
                                    var proratedStorageFTEs = totalStorageFTEs * storageRatio;
                                    resultMap[dataCenterName].u_total_ftes += proratedStorageFTEs;
                                    remainingStorageFTEs -= proratedStorageFTEs;
                                }
                                break;
                            case 'Server':
                                if (dataCenterName !== biggestServerUser) {
                                    var dataCenterServerCount =
                                        parseInt(o.u_total_windows_servers) +
                                        parseInt(o.u_total_other_servers) +
                                        parseInt(o.u_total_mainframes) +
                                        parseInt(o.u_total_hpc_cluster_nodes) +
                                        parseInt(o.u_total_virtual_hosts) +
                                        parseInt(o.u_total_virtual_os);
                                    var serverRatio = dataCenterServerCount / totalServerCount;
                                    var proratedServerFTEs = totalServerFTEs * serverRatio;
                                    resultMap[dataCenterName].u_total_ftes += proratedServerFTEs;
                                    remainingServerFTEs -= proratedServerFTEs;
                                }
                                break;
                            default:

                        }
                    }

                    if (o.u_rack_count) {
                        resultMap[dataCenterName].u_rack_count += parseInt(o.u_rack_count);
                    }
                    if (o.u_total_mainframes) {
                        resultMap[dataCenterName].u_total_mainframes += parseInt(o.u_total_mainframes);
                    }
                    if (o.u_total_windows_servers) {
                        resultMap[dataCenterName].u_total_windows_servers += parseInt(o.u_total_windows_servers);
                    }
                    if (o.u_total_hpc_cluster_nodes) {
                        resultMap[dataCenterName].u_total_hpc_cluster_nodes += parseInt(o.u_total_hpc_cluster_nodes);
                    }
                    if (o.u_total_other_servers) {
                        resultMap[dataCenterName].u_total_other_servers += parseInt(o.u_total_other_servers);
                    }
                    if (o.u_total_virtual_hosts) {
                        resultMap[dataCenterName].u_total_virtual_hosts += parseInt(o.u_total_virtual_hosts);
                    }
                    if (o.u_total_virtual_os) {
                        resultMap[dataCenterName].u_total_virtual_os += parseInt(o.u_total_virtual_os);
                    }
                    if (o.u_total_storage) {
                        resultMap[dataCenterName].u_total_storage += parseFloat(o.u_total_storage);
                    }
                    if (o.u_used_storage) {
                        resultMap[dataCenterName].u_used_storage += parseFloat(o.u_used_storage);
                    }
                });

                console.log('Remaining DCM FTEs: ' + remainingDcmFTEs);
                console.log('Remaining Storage FTEs: ' + remainingStorageFTEs);
                console.log('Remaining Server FTEs: ' + remainingServerFTEs);

                resultMap[biggestElectricityUser].u_total_ftes += remainingDcmFTEs;
                resultMap[biggestStorageUser].u_total_ftes += remainingStorageFTEs;
                resultMap[biggestServerUser].u_total_ftes += remainingServerFTEs;


                var keys = Object.keys(resultMap);
                console.log('keys: ' + keys);

                keys.forEach(function (key) {
                    if (key !== biggestElectricityUser && key !== biggestStorageUser && key !== biggestServerUser) {
                        if (resultMap[key].u_total_ftes < 0.1) {
                            var diff = 0.1 - resultMap[key].u_total_ftes;
                            resultMap[key].u_total_ftes = 0.1;
                            resultMap[biggestServerUser].u_total_ftes -= diff;
                        }
                    }
                });

                resultMap['atc_warehouse'].u_average_it_electricity_usage += resultMap['atc-dceg'].u_average_it_electricity_usage;
                resultMap['atc_warehouse'].u_total_ftes += resultMap['atc-dceg'].u_total_ftes;
                resultMap['atc_warehouse'].u_automated_monitoring = resultMap['atc-dceg'].u_automated_monitoring;
                resultMap['atc_warehouse'].u_server_utilization += resultMap['atc-dceg'].u_server_utilization;
                resultMap['atc_warehouse'].u_rack_count += resultMap['atc-dceg'].u_rack_count;
                resultMap['atc_warehouse'].u_total_mainframes += resultMap['atc-dceg'].u_total_mainframes;
                resultMap['atc_warehouse'].u_total_windows_servers += resultMap['atc-dceg'].u_total_windows_servers;
                resultMap['atc_warehouse'].u_total_hpc_cluster_nodes += resultMap['atc-dceg'].u_total_hpc_cluster_nodes;
                resultMap['atc_warehouse'].u_total_other_servers += resultMap['atc-dceg'].u_total_other_servers;
                resultMap['atc_warehouse'].u_total_virtual_hosts += resultMap['atc-dceg'].u_total_virtual_hosts;
                resultMap['atc_warehouse'].u_total_virtual_os += resultMap['atc-dceg'].u_total_virtual_os;
                resultMap['atc_warehouse'].u_total_storage += resultMap['atc-dceg'].u_total_storage;
                resultMap['atc_warehouse'].u_used_storage += resultMap['atc-dceg'].u_used_storage;

                resultMap['9609mc_te21'].u_average_it_electricity_usage += resultMap['9609mc_te21-ccr'].u_average_it_electricity_usage;
                resultMap['9609mc_te21'].u_average_it_electricity_usage += resultMap['9609mc_te21-dea'].u_average_it_electricity_usage;
                resultMap['9609mc_te21'].u_total_ftes += resultMap['9609mc_te21-ccr'].u_total_ftes;
                resultMap['9609mc_te21'].u_total_ftes += resultMap['9609mc_te21-dea'].u_total_ftes;
                resultMap['9609mc_te21'].u_automated_monitoring = resultMap['9609mc_te21-ccr'].u_automated_monitoring.toLowerCase() === 'yes' && resultMap['9609mc_te21-dea'].u_automated_monitoring.toLowerCase() === 'yes' ? 'yes' : 'no';
                resultMap['9609mc_te21'].u_server_utilization += resultMap['9609mc_te21-ccr'].u_server_utilization;
                resultMap['9609mc_te21'].u_server_utilization += resultMap['9609mc_te21-dea'].u_server_utilization;
                resultMap['9609mc_te21'].u_server_utilization /= 2; // simplified calculation of average utilization between two colocating users. This can be calculated based on number of servers used by each colocating user.
                resultMap['9609mc_te21'].u_rack_count += resultMap['9609mc_te21-ccr'].u_rack_count;
                resultMap['9609mc_te21'].u_rack_count += resultMap['9609mc_te21-dea'].u_rack_count;
                resultMap['9609mc_te21'].u_total_mainframes += resultMap['9609mc_te21-ccr'].u_total_mainframes;
                resultMap['9609mc_te21'].u_total_mainframes += resultMap['9609mc_te21-dea'].u_total_mainframes;
                resultMap['9609mc_te21'].u_total_windows_servers += resultMap['9609mc_te21-ccr'].u_total_windows_servers;
                resultMap['9609mc_te21'].u_total_windows_servers += resultMap['9609mc_te21-dea'].u_total_windows_servers;
                resultMap['9609mc_te21'].u_total_hpc_cluster_nodes += resultMap['9609mc_te21-ccr'].u_total_hpc_cluster_nodes;
                resultMap['9609mc_te21'].u_total_hpc_cluster_nodes += resultMap['9609mc_te21-dea'].u_total_hpc_cluster_nodes;
                resultMap['9609mc_te21'].u_total_other_servers += resultMap['9609mc_te21-ccr'].u_total_other_servers;
                resultMap['9609mc_te21'].u_total_other_servers += resultMap['9609mc_te21-dea'].u_total_other_servers;
                resultMap['9609mc_te21'].u_total_virtual_hosts += resultMap['9609mc_te21-ccr'].u_total_virtual_hosts;
                resultMap['9609mc_te21'].u_total_virtual_hosts += resultMap['9609mc_te21-dea'].u_total_virtual_hosts;
                resultMap['9609mc_te21'].u_total_virtual_os += resultMap['9609mc_te21-ccr'].u_total_virtual_os;
                resultMap['9609mc_te21'].u_total_virtual_os += resultMap['9609mc_te21-dea'].u_total_virtual_os;
                resultMap['9609mc_te21'].u_total_storage += resultMap['9609mc_te21-ccr'].u_total_storage;
                resultMap['9609mc_te21'].u_total_storage += resultMap['9609mc_te21-dea'].u_total_storage;
                resultMap['9609mc_te21'].u_used_storage += resultMap['9609mc_te21-ccr'].u_used_storage;
                resultMap['9609mc_te21'].u_used_storage += resultMap['9609mc_te21-dea'].u_used_storage;


                delete resultMap['atc-dceg'];
                delete resultMap['9609mc_te21-ccr'];
                delete resultMap['9609mc_te21-dea'];

                var workbook = new Excel.Workbook();
                var sheet = workbook.addWorksheet('Utilization', {
                    properties: {
                        tabColor: {
                            argb: 'FF00FF00'
                        }
                    }
                });

                sheet.columns = [{
                    header: 'IC',
                    key: 'u_ic'
                },
                {
                    header: 'Data Center Name',
                    key: 'u_data_call'
                },
                {
                    header: 'Average IT Electricity Usage (kW/hr)',
                    key: 'u_average_it_electricity_usage'
                },
                {
                    header: 'Automated Monitoring',
                    key: 'u_automated_monitoring'
                },
                {
                    header: 'Server Utilization (%)',
                    key: 'u_server_utilization'
                },
                {
                    header: 'FTE',
                    key: 'u_total_ftes'
                },
                {
                    header: 'Rack Count',
                    key: 'u_rack_count'
                },
                {
                    header: 'Total Mainframes',
                    key: 'u_total_mainframes'
                },
                {
                    header: 'Total Windows Servers',
                    key: 'u_total_windows_servers'
                },
                {
                    header: 'Total HPC Cluster Nodes',
                    key: 'u_total_hpc_cluster_nodes'
                },
                {
                    header: 'Total Other Servers',
                    key: 'u_total_other_servers'
                },
                {
                    header: 'Total Virtual Hosts',
                    key: 'u_total_virtual_hosts'
                },
                {
                    header: 'Total Virtual OS',
                    key: 'u_total_virtual_os'
                },
                {
                    header: 'Total Storage (TB)',
                    key: 'u_total_storage'
                },
                {
                    header: 'Total Used Storage (TB)',
                    key: 'u_used_storage'
                },
                {
                    header: 'Closing Stage',
                    key: 'u_closing_stage'
                },
                {
                    header: 'Closing Year',
                    key: 'u_closing_on_fiscal_year'
                },
                {
                    header: 'Closing Quarter',
                    key: 'u_closing_on_quarter'
                }
                ];

                sheet.getColumn(6).numFmt = '0.0';

                keys = Object.keys(resultMap);

                keys.forEach(function (key) {
                    console.log('exporting key ' + key);
                    sheet.addRow({
                        u_ic: resultMap[key].u_ic,
                        u_data_call: resultMap[key].u_data_call,
                        u_average_it_electricity_usage: resultMap[key].u_average_it_electricity_usage,
                        u_automated_monitoring: resultMap[key].u_automated_monitoring,
                        u_server_utilization: resultMap[key].u_automated_monitoring.toLowerCase() === 'yes' ? resultMap[key].u_server_utilization : 'N.A.',
                        u_total_ftes: resultMap[key].u_total_ftes,
                        u_rack_count: resultMap[key].u_rack_count,
                        u_total_mainframes: resultMap[key].u_total_mainframes,
                        u_total_windows_servers: resultMap[key].u_total_windows_servers,
                        u_total_hpc_cluster_nodes: resultMap[key].u_total_hpc_cluster_nodes,
                        u_total_other_servers: resultMap[key].u_total_other_servers,
                        u_total_virtual_hosts: resultMap[key].u_total_virtual_hosts,
                        u_total_virtual_os: resultMap[key].u_total_virtual_os,
                        u_total_storage: resultMap[key].u_total_storage,
                        u_used_storage: resultMap[key].u_used_storage,
                        u_closing_stage: resultMap[key].u_closing_stage,
                        u_closing_on_quarter: resultMap[key].u_closing_on_quarter,
                        u_closing_on_fiscal_year: resultMap[key].u_closing_on_fiscal_year
                    });
                });

                const exportFile = config.sn.tempLocation + 'UtilizationReport_Q' + req.params.quarter + '.xlsx';

                workbook.xlsx.writeFile(exportFile)
                    .then(function () {
                        res.sendFile(exportFile);
                    });

                // res.send(data);
            });
        });

    return excelApiRouter;
};


function getDataCenterName(dataCenterName, category) {

    if (dataCenterName === 'atc_warehouse' && category === 'DCEG-ATC Warehouse') {
        return 'atc-dceg';
    }
    if (dataCenterName === '9609mc_te21' && category === 'CCR-CGB') {
        return '9609mc_te21-ccr';
    }
    if (dataCenterName === '9609mc_te21' && category === 'DEA') {
        return '9609mc_te21-dea';
    }


    return dataCenterName;
}

module.exports = router;