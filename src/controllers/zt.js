/*
  ztncui - ZeroTier network controller UI
  Copyright (C) 2017-2021  Key Networks (https://key-networks.com)
  Licensed under GPLv3 - see LICENSE for details.
*/

const got = require('got');
const ipaddr = require('ip-address');
const token = require('./token');

const ZT_ADDR = process.env.ZT_ADDR || 'localhost:9993';

const init_options = async function() {
  let tok = null;

  try {
    tok = await token.get();
  } catch (err) {
    throw(err);
  }

  options = {
    json: true,
    headers: {
      'X-ZT1-Auth': tok
    }
  }

  return options;
}

const get_zt_status = async function() {
  const options = await init_options();

  try {
    const response = await got(ZT_ADDR + '/status', options);
    return response.body;
  } catch(err) {
    throw(err);
  }
}
exports.get_zt_status = get_zt_status;

const get_zt_address = async function() {
  return (await get_zt_status()).address;
}
exports.get_zt_address = get_zt_address;

exports.network_list = async function() {
  const options = await init_options();

  let network = {};
  let networks = [];
  let nwids = [];

  try {
    const response = await got(ZT_ADDR + '/controller/network', options);
    nwids = response.body;
  } catch(err) {
    throw(err);
  }

  for (let nwid of nwids) {
    try {
      const response = await got(ZT_ADDR + '/controller/network/'
                                                              + nwid, options);
      network = (({name, nwid}) => ({name, nwid}))(response.body);
      networks.push(network);
    } catch(err) {
      throw(err);
    }
  }
  return networks;
}

const network_detail = async function(nwid) {
  const options = await init_options();

  try {
    const response = await got(ZT_ADDR + '/controller/network/'
                                                              + nwid, options);
    return response.body;
  } catch(err) {
    throw(err);
  }
}
exports.network_detail = network_detail;

exports.network_create = async function(name) {
  const options = await init_options();
  options.method = 'POST';
  options.body = name;

  const zt_address = await get_zt_address();

  try {
    const response = await got(ZT_ADDR + '/controller/network/'
                                              + zt_address + '______', options);
    return response.body;
  } catch(err) {
    throw(err);
  }
}

exports.network_delete = async function(nwid) {
  const options = await init_options();
  options.method = 'DELETE';

  try {
    const response = await got(ZT_ADDR + '/controller/network/'
                                                              + nwid, options);
    response.body.deleted = true;
    return response.body;
  } catch(err) {
    throw(err);
  }
}

exports.ipAssignmentPools = async function(nwid, ipAssignmentPool, action) {
  const options = await init_options();
  options.method = 'POST';

  const network = await network_detail(nwid);
  let ipAssignmentPools = network.ipAssignmentPools;

  if (action === 'add') {
    ipAssignmentPools.push(ipAssignmentPool);
  } else if (action === 'delete') {
    const pool = ipAssignmentPools.find(pool =>
      pool.ipRangeStart === ipAssignmentPool.ipRangeStart &&
      pool.ipRangeEnd === ipAssignmentPool.ipRangeEnd);
    ipAssignmentPools = ipAssignmentPools.filter(p => p != pool);
  }

  options.body = { ipAssignmentPools: ipAssignmentPools };


  try {
    const response = await got(ZT_ADDR + '/controller/network/'
                                                              + nwid, options);
    return response.body;
  } catch(err) {
    throw(err);
  }
}

exports.ipAssignmentDelete = async function(nwid, id, ipAssignmentIndex) {
  const options = await init_options();
  options.method = 'POST';

  try {
    const member = await member_detail(nwid, id);
    const ipAssignments = member.ipAssignments;
    ipAssignments.splice(ipAssignmentIndex, 1);
    options.body = { ipAssignments: ipAssignments };
    const response = await got(ZT_ADDR + '/controller/network/'
                                            + nwid + '/member/' + id, options);
    response.body.deleted = true;
    return response.body;
  } catch(err) {
    throw(err);
  }
}

exports.ipAssignmentAdd = async function(nwid, id, ipAssignment) {
  const options = await init_options();
  options.method = 'POST';

  try {
    const member = await member_detail(nwid, id);
    const ipAssignments = member.ipAssignments;
    ipAssignments.push(ipAssignment.ipAddress);
    options.body = { ipAssignments: ipAssignments };
    const response = await got(ZT_ADDR + '/controller/network/'
                                            + nwid + '/member/' + id, options);
    response.body.added = true;
    return response.body;
  } catch(err) {
    throw(err);
  }
}

exports.routes = async function(nwid, route, action) {
  const options = await init_options();
  options.method = 'POST';

  const network = await network_detail(nwid);
  let routes = network.routes;
  route.target = canonicalTarget(route.target);

  const route_to_del = routes.find(rt => canonicalTarget(rt.target) === route.target);

  if (!route_to_del) {
    if (action === 'add') {
      routes.push(route);
    } else if (action === 'delete') {
      throw new Error('Cannot delete non-existent route target');
    }
  } else {
    if (action === 'add') {
      throw new Error('Route target is not unique');
    } else if (action === 'delete') {
      routes = routes.filter(rt => rt != route_to_del);
    }
  }

  options.body = { routes: routes };


  try {
    const response = await got(ZT_ADDR + '/controller/network/'
                                                              + nwid, options);
    return response.body;
  } catch(err) {
    throw(err);
  }
}

function canonicalTarget(target) {
  const target6 = new ipaddr.Address6(target);
  if (target6.isValid()) {
    const parts = target.split('/');
    return target6.canonicalForm() + '/' + parts[1];
  }
  return target;
}

exports.network_object = async function(nwid, object) {
  const options = await init_options();
  options.method = 'POST';
  options.body = object;

  try {
    const response = await got(ZT_ADDR + '/controller/network/'
                                                              + nwid, options);
    return response.body;
  } catch(err) {
    throw(err);
  }
}

exports.members = async function(nwid) {
  const options = await init_options();

  try {
    const response = await got(ZT_ADDR + '/controller/network/'
                                                  + nwid + '/member', options);
    return response.body;
  } catch(err) {
    throw(err);
  }
}

const member_detail = async function(nwid, id) {
  const options = await init_options();

  try {
    const response = await got(ZT_ADDR + '/controller/network/'
                                            + nwid + '/member/' + id, options);
    return response.body;
  } catch(err) {
    throw(err);
  }
}
exports.member_detail = member_detail;

exports.member_object = async function(nwid, id, object) {
  const options = await init_options();
  options.method = 'POST';
  options.body = object;

  try {
    const response = await got(ZT_ADDR + '/controller/network/'
                                            + nwid + '/member/' + id, options);
    return response.body;
  } catch(err) {
    throw(err);
  }
}

exports.member_delete = async function(nwid, id) {
  const options = await init_options();
  options.method = 'DELETE';

  try {
    const response = await got(ZT_ADDR + '/controller/network/'
                                            + nwid + '/member/' + id, options);
    response.body.deleted = true;
    return response.body;
  } catch(err) {
    throw(err);
  }
}

exports.network_easy_setup = async function(nwid,
                                            routes,
                                            ipAssignmentPools,
                                            v4AssignMode) {
  const options = await init_options();
  options.method = 'POST';
  options.body =
    {
      ipAssignmentPools: ipAssignmentPools,
      routes: routes,
      v4AssignMode: v4AssignMode
    };

  try {
    const response = await got(ZT_ADDR + '/controller/network/'
                                                              + nwid, options);
    return response.body;
  } catch(err) {
    throw(err);
  }
}

exports.peers = async function() {
  const options = await init_options();
  const response = await got(ZT_ADDR + '/peer', options);
  return response.body;
}

exports.peer = async function(id) {
  const options = await init_options();
  try {
    const response = await got(ZT_ADDR + '/peer/' + id, options);
    return response.body;
  } catch (error) {
    if (error instanceof got.HTTPError && error.statusCode == 404) {
      return null;
    }
    throw error;
  }
}
