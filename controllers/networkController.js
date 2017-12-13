/*
  ztncui - ZeroTier network controller UI
  Copyright (C) 2017  Key Networks (https://key-networks.com)
  Licensed under GPLv3 - see LICENSE for details.
*/

const fs = require('fs');
const ipaddr = require('ip-address');
const storage = require('node-persist');
const zt = require('./zt');

storage.initSync({dir: 'etc/storage'});

// ZT network controller home page
exports.index = async function(req, res) {
  const page = 'controller_home';

  try {
    zt_address = await zt.get_zt_address();
    res.render('index', {title: 'ztncui', page: page, zt_address: zt_address});
  } catch (err) {
    res.render('index', {title: 'ztncui',
                      page: page, error: 'ERROR resolving ZT address: ' + err});
  }
};

// Display list of all networks on this ZT network controller
exports.network_list = async function(req, res) {
  const page = 'networks';

  try {
    networks = await zt.network_list();
    res.render('networks', {title: 'Networks on this controller', page: page, networks: networks});
  } catch (err) {
    res.render('networks', {title: 'Networks on this controller', page: page, error: 'Error retrieving list of networks on this controller: ' + err});
  }
};

// Display detail page for specific network
exports.network_detail = async function(req, res) {
  const page = 'networks';

  try {
    const network = await zt.network_detail(req.params.nwid);
    const members = await zt.members(req.params.nwid);
    res.render('network_detail', {title: 'Detail for network', page: page, network: network, members: members});
  } catch (err) {
    res.render('network_detail', {title: 'Detail for network', page: page, error: 'Error resolving detail for network ' + req.params.nwid + ': ' + err});
  }
};

// Display Network create form on GET
exports.network_create_get = function(req, res) {
  const page = 'add_network';

  res.render('network_create', {title: 'Create network', page: page});
};

// Handle Network create on POST
exports.network_create_post = async function(req, res) {
  const page = 'add_network';

  req.checkBody('name', 'Network name required').notEmpty();

  req.sanitize('name').escape();
  req.sanitize('name').trim();

  const errors = req.validationErrors();

  const name = { name: req.body.name };

  if (errors) {
    res.render('network_create', {title: 'Create Network', page: page, name: name, errors: errors});
    return;
  } else {
    try {
      const network = await zt.network_create(name);
      res.redirect('/controller/networks');
    } catch (err) {
      res.render('network_detail', {title: 'Create Network - error', page: page, error: 'Error creating network ' + name.name});
    }
  }
};

// Display Network delete form on GET
exports.network_delete_get = async function(req, res) {
  const page = 'networks';

  try {
    const network = await zt.network_detail(req.params.nwid);
    res.render('network_delete', {title: 'Delete network', page: page,
                                    nwid: req.params.nwid, network: network});
  } catch (err) {
    res.render('network_delete', {title: 'Delete network', page: page, error: 'Error resolving network ' + req.params.nwid + ': ' + err});
  }
};

// Handle Network delete on POST
exports.network_delete_post = async function(req, res) {
  const page = 'networks';

  try {
    const network = await zt.network_delete(req.params.nwid);
    res.render('network_delete', {title: 'Delete network', page: page, network: network});
  } catch (err) {
    res.render('network_delete', {title: 'Delete network', page: page, error: 'Error deleting network ' + req.params.nwid + ': ' + err});
  }
};

// Network object GET
exports.network_object = async function(req, res) {
  const page = 'networks';

  try {
    const network = await zt.network_detail(req.params.nwid);
    res.render(req.params.object, {title: req.params.object, page: page, network: network}, function(err, html) {
      if (err) {
        if (err.message.indexOf('Failed to lookup view') !== -1 ) {
          return res.render('not_implemented', {title: req.params.object, page: page, network: network});
        }
        throw err;
      }
      res.send(html);
    });
  } catch (err) {
    res.render(req.params.object, {title: req.params.object, page: page, error: 'Error resolving detail for network ' + req.params.nwid + ': ' + err});
  }
}

// Handle Network rename form on POST
exports.name = async function(req, res) {
  const page = 'networks';

  req.checkBody('name', 'Network name required').notEmpty();
  req.sanitize('name').escape();
  req.sanitize('name').trim();

  const errors = req.validationErrors();

  const name = { name: req.body.name };

  if (errors) {
    try {
      const network = await zt.network_detail(req.params.nwid);
      res.render('name', {title: 'Rename network', page: page, network: network, name: name, errors: errors});
    } catch (err) {
      res.render('name', {title: 'Rename network', page: page, error: 'Error resolving network detail for network ' + req.params.nwid + ': ' + err});
    }
  } else {
    try {
      const network = await zt.network_object(req.params.nwid, name);
      res.redirect('/controller/networks');
    } catch ( err) {
      res.render('name', {title: 'Rename network', page: page, error: 'Error renaming network ' + req.params.nwid + ': ' + err});
    }
  }

};

// ipAssignmentPools POST
exports.ipAssignmentPools = async function(req, res) {
  const page = 'networks';

  req.checkBody('ipRangeStart', 'IP range start required').notEmpty();
  req.checkBody('ipRangeStart', 'IP range start needs a valid IPv4 or IPv6 address').isIP();
  req.sanitize('ipRangeStart').escape();
  req.sanitize('ipRangeStart').trim();
  req.checkBody('ipRangeEnd', 'IP range end required').notEmpty();
  req.checkBody('ipRangeEnd', 'IP range end needs a valid IPv4 or IPv6 address').isIP();
  req.sanitize('ipRangEnd').escape();
  req.sanitize('ipRangEnd').trim();

  const errors = req.validationErrors();

  const ipAssignmentPool =
    {
      ipRangeStart: req.body.ipRangeStart,
      ipRangeEnd: req.body.ipRangeEnd
    };

  if (errors) {
    try {
      const network = await zt.network_detail(req.params.nwid);
      res.render('ipAssignmentPools', {title: 'ipAssignmentPools', page: page, ipAssignmentPool: ipAssignmentPool, network: network, errors: errors});
    } catch (err) {
      res.render('ipAssignmentPools', {title: 'ipAssignmentPools', page: page, error: 'Error resolving network detail for network ' + req.params.nwid + ': ' + err});
    }
  } else {
    try {
      const network = await zt.ipAssignmentPools(req.params.nwid, ipAssignmentPool, 'add');
      res.render('ipAssignmentPools', {title: 'ipAssignmentPools', page: page, ipAssignmentPool: ipAssignmentPool, network: network});
    } catch (err) {
      res.render('ipAssignmentPools', {title: 'ipAssignmentPools', page: page, error: 'Error applying IP Assignment Pools for network ' + req.params.nwid + ': ' + err});
    }
  }
}

isValidPrefix = function(str, max) {
  const num = Math.floor(Number(str));
  return String(num) == str && num >= 0 && num <= max;
}

// routes POST
exports.routes = async function (req, res) {
  const page = 'networks';

  req.checkBody('target', 'Target network is required').notEmpty();
  req.sanitize('target').trim();
  req.checkBody('target', 'Target network must be valid CIDR format')
    .custom(value => {
      const parts = value.split('/');
      const ipv4 = new ipaddr.Address4(parts[0]);
      const ipv6 = new ipaddr.Address6(parts[0]);
      let isValidIPv4orIPv6 = false;
      let prefixMax = 32;
      if (ipv4.isValid()) {
        isValidIPv4orIPv6 = true;
      } else {
      }
      if (ipv6.isValid()) {
        isValidIPv4orIPv6 = true;
        prefixMax = 128;
      } else {
      }
      return isValidIPv4orIPv6 && isValidPrefix(parts[1], prefixMax);
    });
  req.checkBody('via', 'Gateway must be a valid IPv4 or IPv6 address').optional({ checkFalsy: true }).isIP();
  req.sanitize('via').escape();
  req.sanitize('via').trim();
  if (! req.body.via) {
    req.body.via = null;
  }

  const errors = req.validationErrors();

  const route =
    {
      target: req.body.target,
      via: req.body.via
    };

  if (errors) {
    try {
      const network = await zt.network_detail(req.params.nwid);
      res.render('routes', {title: 'routes', page: page, route: route, network: network, errors: errors});
    } catch (err) {
      res.render('routes', {title: 'routes', page: page, error: 'Error resolving network detail'});
    }
  } else {
    try {
      const network = await zt.routes(req.params.nwid, route, 'add');
      res.render('routes', {title: 'routes', page: page, route: route, network: network});
    } catch (err) {
      res.render('routes', {title: 'routes', page: page, error: 'Error adding route for network ' + req.params.nwid + ': ' + err});
    }
  }

}

// route_delete GET
exports.route_delete = async function (req, res) {
  const page = 'networks';

  const route =
    {
      target: req.params.target_ip + '/' + req.params.target_prefix,
      via: null
    };


  try {
    const network = await zt.routes(req.params.nwid, route, 'delete');
    res.render('routes', {title: 'routes', page: page, route: route, network: network});
  } catch (err) {
    res.render('routes', {title: 'routes', page: page, error: 'Error deleting route for network ' + req.params.nwid + ': ' + err});
  }
}

// ipAssignmentPool_delete GET
exports.ipAssignmentPool_delete = async function (req, res) {
  const page = 'networks';

  const ipAssignmentPool =
    {
      ipRangeStart: req.params.ipRangeStart,
      ipRangeEnd: req.params.ipRangeEnd
    };


  try {
    const network = await zt.ipAssignmentPools(req.params.nwid, ipAssignmentPool, 'delete');
    res.render('ipAssignmentPools', {title: 'ipAssignmentPools', page: page, ipAssignmentPool: ipAssignmentPool, network: network});
  } catch (err) {
    res.render('ipAssignmentPools', {title: 'ipAssignmentPools', page: page, error: 'Error deleting IP Assignment Pool for network ' + req.params.nwid + ': ' + err});
  }
}

// v4AssignMode POST
exports.v4AssignMode = async function (req, res) {
  const page = 'networks';

  const v4AssignMode =
    {
      v4AssignMode: { zt: req.body.zt }
    };

  try {
    const network = await zt.network_object(req.params.nwid, v4AssignMode);
    res.render('v4AssignMode', {title: 'v4AssignMode', page: page, network: network});
  } catch (err) {
    res.render('v4AssignMode', {title: 'v4AssignMode', page: page, error: 'Error applying v4AssignMode for network ' + req.params.nwid + ': ' + err});
  }
}

// v6AssignMode POST
exports.v6AssignMode = async function (req, res) {
  const page = 'networks';

  const v6AssignMode =
    {
      v6AssignMode:
        {
          '6plane': req.body['6plane'],
          rfc4193: req.body.rfc4193,
          zt: req.body.zt
        }
    };

  try {
    const network = await zt.network_object(req.params.nwid, v6AssignMode);
    res.render('v6AssignMode', {title: 'v6AssignMode', page: page, network: network});
  } catch (err) {
    res.render('v6AssignMode', {title: 'v6AssignMode', page: page, error: 'Error applying v6AssignMode for network ' + req.params.nwid + ': ' + err});
  }
}

// Display detail page for specific member
exports.member_detail = async function(req, res) {
  const page = 'networks';

  try {
    const network = await zt.network_detail(req.params.nwid);
    const member = await zt.member_detail(req.params.nwid, req.params.id);
    res.render('member_detail', {title: 'Network member detail', page: page, network: network, member: member});
  } catch (err) {
    res.render(req.params.object, {title: req.params.object, page: page, error: 'Error resolving detail for member ' + req.params.id + ' of network ' + req.params.nwid + ': ' + err});
  }
};

// Member object GET
exports.member_object = async function(req, res) {
  const page = 'networks';

  try {
    const network = await zt.network_detail(req.params.nwid);
    const member = await zt.member_detail(req.params.nwid, req.params.id);
    res.render(req.params.object, {title: req.params.object, page: page, network: network, member: member}, function(err, html) {
      if (err) {
        if (err.message.indexOf('Failed to lookup view') !== -1 ) {
          return res.render('not_implemented', {title: req.params.object, page: page, network: network, member: member});
        }
        throw err;
      }
      res.send(html);
    });
  } catch (err) {
    res.render(req.params.object, {title: req.params.object, page: page, error: 'Error resolving detail for member ' + req.params.id + ' of network ' + req.params.nwid + ': ' + err});
  }
}

// Member authorized POST
exports.member_authorized = async function(req, res) {
  const page = 'networks';

  const authorized = { authorized: req.body.authorized };

  try {
    const network = await zt.network_detail(req.params.nwid);
    const member = await zt.member_object(req.params.nwid, req.params.id, authorized);
    res.render('authorized', {title: 'authorized', page: page, network: network, member: member});
  } catch (err) {
    res.render('authorized', {title: 'authorized', page: page, error: 'Error authorizing member ' + req.params.id + ' on network ' + req.params.nwid + ': ' + err});
  }
}

// Easy network setup GET
exports.easy_get = async function(req, res) {
  const page = 'networks';

  try {
    const network = await zt.network_detail(req.params.nwid);
    res.render('network_easy', {title: 'Easy setup of network', page: page, network: network});
  } catch (err) {
    res.render('network_easy', {title: 'Easy setup of network', page: page, error: 'Error resolving detail for network ' + req.params.nwid + ': ' + err});
  }
}

// Easy network setup POST
exports.easy_post = async function(req, res) {
  const page = 'networks';

  req.checkBody('networkCIDR', 'Network address is required').notEmpty();
  req.sanitize('networkCIDR').trim();
  req.checkBody('networkCIDR', 'Network address must be in CIDR notation')
    .custom(value => {
      const parts = value.split('/');
      const ipv4 = new ipaddr.Address4(parts[0]);
      return ipv4.isValid() && isValidPrefix(parts[1], 32);
    });
  req.checkBody('poolStart', 'Start of IP assignment pool is required')
    .notEmpty();
  req.checkBody('poolStart', 'Start of IP assignment pool must be valid IPv4 address')
    .isIP(4);
  req.sanitize('poolStart').escape();
  req.sanitize('poolStart').trim();
  req.checkBody('poolEnd', 'End of IP assignment pool is required')
    .notEmpty();
  req.checkBody('poolEnd', 'End of IP assignment pool must be valid IPv4 address')
    .isIP(4);
  req.sanitize('poolEnd').escape();
  req.sanitize('poolEnd').trim();

  const errors = req.validationErrors();

  const ipAssignmentPools =
    [{
      ipRangeStart: req.body.poolStart,
      ipRangeEnd: req.body.poolEnd
    }];

  const routes =
    [{
      target: req.body.networkCIDR,
      via: null
    }];

  const v4AssignMode =
    {
      zt: true
    };

  if (errors) {
    network =
      {
        ipAssignmentPools: ipAssignmentPools,
        routes: routes,
        v4AssignMode: v4AssignMode
      };

    res.render('network_easy', {title: 'Easy setup of network', page: page, network: network, errors: errors});
  } else {
    try {
      const network = await zt.network_easy_setup(req.params.nwid,
                                                  routes,
                                                  ipAssignmentPools,
                                                  v4AssignMode);
      res.render('network_easy', {title: 'Easy setup of network', page: page, network: network, message: 'Network setup succeeded'});
    } catch (err) {
      res.render('network_easy', {title: 'Easy setup of network', page: page, error: 'Error resolving detail for network ' + req.params.nwid + ': ' + err});
    }
  }
}

// Easy members auth GET or POST
exports.members = async function(req, res) {
  const page = 'networks';

  let errors = null;

  if (req.method === 'POST') {

    req.checkBody('id', 'Member ID is required').notEmpty();
    req.sanitize('id').trim();
    req.sanitize('id').escape();

    if (req.body.auth) {
      req.checkBody('auth', 'Authorization state must be boolean').isBoolean();
      req.sanitize('auth').trim();
      req.sanitize('auth').escape();

      errors = req.validationErrors();

      if (!errors) {
        const auth =
          {
            authorized: req.body.auth
          };

        try {
          const mem = await zt.member_object(req.params.nwid, req.body.id, auth);
        } catch (err) {
          throw err;
        }
      }
    } else if (req.body.name) {
      req.sanitize('name').trim();
      req.sanitize('name').escape();

      errors = req.validationErrors();

      if (!errors) {
        try {
          const ret = await storage.setItem(req.body.id, req.body.name);
        } catch (err) {
          throw err;
        }
      }
    }
  }

  try {
    const network = await zt.network_detail(req.params.nwid);
    const member_ids = await zt.members(req.params.nwid);
    const members = [];
    for (id in member_ids) {
      let member = await zt.member_detail(req.params.nwid, id);
      let name = await storage.getItem(member.id);
      if (!name) name = '';
      member.name = name;
      members.push(member);
    }

    res.render('members', {title: 'Members of this network', page: page,
                          network: network, members: members, errors: errors});
  } catch (err) {
    res.render('members', {title: 'Members of this network', page: page,
      error: 'Error resolving detail for network ' + req.params.nwid
                                                              + ': ' + err});
  }
}

// Member delete GET and POST
exports.member_delete = async function(req, res) {
  const page = 'networks';

  try {
    const network = await zt.network_detail(req.params.nwid);
    let member = null;
    let name = null;
    if (req.method === 'POST') {
      member = await zt.member_delete(req.params.nwid, req.params.id);
      if (member.deleted) {
        name = await storage.removeItem(member.id);
      }
    } else {
      member = await zt.member_detail(req.params.nwid, req.params.id);
      name = await storage.getItem(member.id);
    }
    if (!name) name = '';
    member.name = name;
    res.render('member_delete', {title: 'Delete member from ' + network.name,
                                            network: network, member: member});
  } catch (err) {
    res.render('member_delete', {title: 'Delete member from network', page: page,
                    error: 'Error resolving detail for member ' + req.params.id
                              + ' of network ' + req.params.nwid + ': ' + err});
  }
}

