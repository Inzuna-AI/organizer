// Automatisch erzeugt aus dem Code-Repo „organizer“ (npm run build:notify). Nicht von Hand bearbeiten.
import { createRequire as __createRequire } from 'node:module'; const require = __createRequire(import.meta.url);
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  try {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  } catch (e) {
    throw mod = 0, e;
  }
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// node_modules/rrule/dist/es5/rrule.js
var require_rrule = __commonJS({
  "node_modules/rrule/dist/es5/rrule.js"(exports, module) {
    (function webpackUniversalModuleDefinition(root, factory) {
      if (typeof exports === "object" && typeof module === "object")
        module.exports = factory();
      else if (typeof define === "function" && define.amd)
        define([], factory);
      else if (typeof exports === "object")
        exports["rrule"] = factory();
      else
        root["rrule"] = factory();
    })(typeof self !== "undefined" ? self : exports, () => {
      return (
        /******/
        (() => {
          "use strict";
          var __webpack_require__ = {};
          (() => {
            __webpack_require__.d = (exports2, definition) => {
              for (var key in definition) {
                if (__webpack_require__.o(definition, key) && !__webpack_require__.o(exports2, key)) {
                  Object.defineProperty(exports2, key, { enumerable: true, get: definition[key] });
                }
              }
            };
          })();
          (() => {
            __webpack_require__.o = (obj, prop) => Object.prototype.hasOwnProperty.call(obj, prop);
          })();
          (() => {
            __webpack_require__.r = (exports2) => {
              if (typeof Symbol !== "undefined" && Symbol.toStringTag) {
                Object.defineProperty(exports2, Symbol.toStringTag, { value: "Module" });
              }
              Object.defineProperty(exports2, "__esModule", { value: true });
            };
          })();
          var __webpack_exports__ = {};
          __webpack_require__.r(__webpack_exports__);
          __webpack_require__.d(__webpack_exports__, {
            "ALL_WEEKDAYS": () => (
              /* reexport */
              ALL_WEEKDAYS
            ),
            "Frequency": () => (
              /* reexport */
              Frequency
            ),
            "RRule": () => (
              /* reexport */
              RRule2
            ),
            "RRuleSet": () => (
              /* reexport */
              RRuleSet
            ),
            "Weekday": () => (
              /* reexport */
              Weekday
            ),
            "datetime": () => (
              /* reexport */
              datetime
            ),
            "rrulestr": () => (
              /* reexport */
              rrulestr
            )
          });
          ;
          var ALL_WEEKDAYS = [
            "MO",
            "TU",
            "WE",
            "TH",
            "FR",
            "SA",
            "SU"
          ];
          var Weekday = (
            /** @class */
            (function() {
              function Weekday2(weekday, n) {
                if (n === 0)
                  throw new Error("Can't create weekday with n == 0");
                this.weekday = weekday;
                this.n = n;
              }
              Weekday2.fromStr = function(str) {
                return new Weekday2(ALL_WEEKDAYS.indexOf(str));
              };
              Weekday2.prototype.nth = function(n) {
                return this.n === n ? this : new Weekday2(this.weekday, n);
              };
              Weekday2.prototype.equals = function(other) {
                return this.weekday === other.weekday && this.n === other.n;
              };
              Weekday2.prototype.toString = function() {
                var s = ALL_WEEKDAYS[this.weekday];
                if (this.n)
                  s = (this.n > 0 ? "+" : "") + String(this.n) + s;
                return s;
              };
              Weekday2.prototype.getJsWeekday = function() {
                return this.weekday === 6 ? 0 : this.weekday + 1;
              };
              return Weekday2;
            })()
          );
          ;
          var isPresent = function(value) {
            return value !== null && value !== void 0;
          };
          var isNumber = function(value) {
            return typeof value === "number";
          };
          var isWeekdayStr = function(value) {
            return typeof value === "string" && ALL_WEEKDAYS.includes(value);
          };
          var isArray = Array.isArray;
          var range = function(start, end) {
            if (end === void 0) {
              end = start;
            }
            if (arguments.length === 1) {
              end = start;
              start = 0;
            }
            var rang = [];
            for (var i = start; i < end; i++)
              rang.push(i);
            return rang;
          };
          var clone = function(array) {
            return [].concat(array);
          };
          var repeat = function(value, times) {
            var i = 0;
            var array = [];
            if (isArray(value)) {
              for (; i < times; i++)
                array[i] = [].concat(value);
            } else {
              for (; i < times; i++)
                array[i] = value;
            }
            return array;
          };
          var toArray = function(item) {
            if (isArray(item)) {
              return item;
            }
            return [item];
          };
          function padStart(item, targetLength, padString) {
            if (padString === void 0) {
              padString = " ";
            }
            var str = String(item);
            targetLength = targetLength >> 0;
            if (str.length > targetLength) {
              return String(str);
            }
            targetLength = targetLength - str.length;
            if (targetLength > padString.length) {
              padString += repeat(padString, targetLength / padString.length);
            }
            return padString.slice(0, targetLength) + String(str);
          }
          var split = function(str, sep, num) {
            var splits = str.split(sep);
            return num ? splits.slice(0, num).concat([splits.slice(num).join(sep)]) : splits;
          };
          var pymod = function(a, b) {
            var r = a % b;
            return r * b < 0 ? r + b : r;
          };
          var divmod = function(a, b) {
            return { div: Math.floor(a / b), mod: pymod(a, b) };
          };
          var empty = function(obj) {
            return !isPresent(obj) || obj.length === 0;
          };
          var notEmpty = function(obj) {
            return !empty(obj);
          };
          var includes = function(arr, val) {
            return notEmpty(arr) && arr.indexOf(val) !== -1;
          };
          ;
          var datetime = function(y, m, d, h, i, s) {
            if (h === void 0) {
              h = 0;
            }
            if (i === void 0) {
              i = 0;
            }
            if (s === void 0) {
              s = 0;
            }
            return new Date(Date.UTC(y, m - 1, d, h, i, s));
          };
          var MONTH_DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
          var ONE_DAY = 1e3 * 60 * 60 * 24;
          var MAXYEAR = 9999;
          var ORDINAL_BASE = datetime(1970, 1, 1);
          var PY_WEEKDAYS = [6, 0, 1, 2, 3, 4, 5];
          var getYearDay = function(date) {
            var dateNoTime = new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
            return Math.ceil((dateNoTime.valueOf() - new Date(date.getUTCFullYear(), 0, 1).valueOf()) / ONE_DAY) + 1;
          };
          var isLeapYear = function(year) {
            return year % 4 === 0 && year % 100 !== 0 || year % 400 === 0;
          };
          var isDate = function(value) {
            return value instanceof Date;
          };
          var isValidDate = function(value) {
            return isDate(value) && !isNaN(value.getTime());
          };
          var tzOffset = function(date) {
            return date.getTimezoneOffset() * 60 * 1e3;
          };
          var daysBetween2 = function(date1, date2) {
            var date1ms = date1.getTime();
            var date2ms = date2.getTime();
            var differencems = date1ms - date2ms;
            return Math.round(differencems / ONE_DAY);
          };
          var toOrdinal = function(date) {
            return daysBetween2(date, ORDINAL_BASE);
          };
          var fromOrdinal = function(ordinal) {
            return new Date(ORDINAL_BASE.getTime() + ordinal * ONE_DAY);
          };
          var getMonthDays = function(date) {
            var month = date.getUTCMonth();
            return month === 1 && isLeapYear(date.getUTCFullYear()) ? 29 : MONTH_DAYS[month];
          };
          var getWeekday = function(date) {
            return PY_WEEKDAYS[date.getUTCDay()];
          };
          var monthRange = function(year, month) {
            var date = datetime(year, month + 1, 1);
            return [getWeekday(date), getMonthDays(date)];
          };
          var combine = function(date, time) {
            time = time || date;
            return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), time.getHours(), time.getMinutes(), time.getSeconds(), time.getMilliseconds()));
          };
          var dateutil_clone = function(date) {
            var dolly = new Date(date.getTime());
            return dolly;
          };
          var cloneDates = function(dates) {
            var clones = [];
            for (var i = 0; i < dates.length; i++) {
              clones.push(dateutil_clone(dates[i]));
            }
            return clones;
          };
          var sort = function(dates) {
            dates.sort(function(a, b) {
              return a.getTime() - b.getTime();
            });
          };
          var timeToUntilString = function(time, utc) {
            if (utc === void 0) {
              utc = true;
            }
            var date = new Date(time);
            return [
              padStart(date.getUTCFullYear().toString(), 4, "0"),
              padStart(date.getUTCMonth() + 1, 2, "0"),
              padStart(date.getUTCDate(), 2, "0"),
              "T",
              padStart(date.getUTCHours(), 2, "0"),
              padStart(date.getUTCMinutes(), 2, "0"),
              padStart(date.getUTCSeconds(), 2, "0"),
              utc ? "Z" : ""
            ].join("");
          };
          var untilStringToDate = function(until) {
            var re = /^(\d{4})(\d{2})(\d{2})(T(\d{2})(\d{2})(\d{2})Z?)?$/;
            var bits = re.exec(until);
            if (!bits)
              throw new Error("Invalid UNTIL value: ".concat(until));
            return new Date(Date.UTC(parseInt(bits[1], 10), parseInt(bits[2], 10) - 1, parseInt(bits[3], 10), parseInt(bits[5], 10) || 0, parseInt(bits[6], 10) || 0, parseInt(bits[7], 10) || 0));
          };
          var dateTZtoISO8601 = function(date, timeZone) {
            var dateStr = date.toLocaleString("sv-SE", { timeZone });
            return dateStr.replace(" ", "T") + "Z";
          };
          var dateInTimeZone = function(date, timeZone) {
            var localTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
            var dateInLocalTZ = new Date(dateTZtoISO8601(date, localTimeZone));
            var dateInTargetTZ = new Date(dateTZtoISO8601(date, timeZone !== null && timeZone !== void 0 ? timeZone : "UTC"));
            var tzOffset2 = dateInTargetTZ.getTime() - dateInLocalTZ.getTime();
            return new Date(date.getTime() - tzOffset2);
          };
          ;
          var IterResult = (
            /** @class */
            (function() {
              function IterResult2(method, args) {
                this.minDate = null;
                this.maxDate = null;
                this._result = [];
                this.total = 0;
                this.method = method;
                this.args = args;
                if (method === "between") {
                  this.maxDate = args.inc ? args.before : new Date(args.before.getTime() - 1);
                  this.minDate = args.inc ? args.after : new Date(args.after.getTime() + 1);
                } else if (method === "before") {
                  this.maxDate = args.inc ? args.dt : new Date(args.dt.getTime() - 1);
                } else if (method === "after") {
                  this.minDate = args.inc ? args.dt : new Date(args.dt.getTime() + 1);
                }
              }
              IterResult2.prototype.accept = function(date) {
                ++this.total;
                var tooEarly = this.minDate && date < this.minDate;
                var tooLate = this.maxDate && date > this.maxDate;
                if (this.method === "between") {
                  if (tooEarly)
                    return true;
                  if (tooLate)
                    return false;
                } else if (this.method === "before") {
                  if (tooLate)
                    return false;
                } else if (this.method === "after") {
                  if (tooEarly)
                    return true;
                  this.add(date);
                  return false;
                }
                return this.add(date);
              };
              IterResult2.prototype.add = function(date) {
                this._result.push(date);
                return true;
              };
              IterResult2.prototype.getValue = function() {
                var res = this._result;
                switch (this.method) {
                  case "all":
                  case "between":
                    return res;
                  case "before":
                  case "after":
                  default:
                    return res.length ? res[res.length - 1] : null;
                }
              };
              IterResult2.prototype.clone = function() {
                return new IterResult2(this.method, this.args);
              };
              return IterResult2;
            })()
          );
          const iterresult = IterResult;
          ;
          var extendStatics = function(d, b) {
            extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d2, b2) {
              d2.__proto__ = b2;
            } || function(d2, b2) {
              for (var p in b2) if (Object.prototype.hasOwnProperty.call(b2, p)) d2[p] = b2[p];
            };
            return extendStatics(d, b);
          };
          function __extends(d, b) {
            if (typeof b !== "function" && b !== null)
              throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
            extendStatics(d, b);
            function __() {
              this.constructor = d;
            }
            d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
          }
          var __assign = function() {
            __assign = Object.assign || function __assign2(t) {
              for (var s, i = 1, n = arguments.length; i < n; i++) {
                s = arguments[i];
                for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
              }
              return t;
            };
            return __assign.apply(this, arguments);
          };
          function __rest(s, e) {
            var t = {};
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
              t[p] = s[p];
            if (s != null && typeof Object.getOwnPropertySymbols === "function")
              for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
                if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                  t[p[i]] = s[p[i]];
              }
            return t;
          }
          function __decorate(decorators, target, key, desc) {
            var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
            if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
            else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
            return c > 3 && r && Object.defineProperty(target, key, r), r;
          }
          function __param(paramIndex, decorator) {
            return function(target, key) {
              decorator(target, key, paramIndex);
            };
          }
          function __metadata(metadataKey, metadataValue) {
            if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(metadataKey, metadataValue);
          }
          function __awaiter(thisArg, _arguments, P, generator) {
            function adopt(value) {
              return value instanceof P ? value : new P(function(resolve) {
                resolve(value);
              });
            }
            return new (P || (P = Promise))(function(resolve, reject) {
              function fulfilled(value) {
                try {
                  step(generator.next(value));
                } catch (e) {
                  reject(e);
                }
              }
              function rejected(value) {
                try {
                  step(generator["throw"](value));
                } catch (e) {
                  reject(e);
                }
              }
              function step(result) {
                result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
              }
              step((generator = generator.apply(thisArg, _arguments || [])).next());
            });
          }
          function __generator(thisArg, body) {
            var _ = { label: 0, sent: function() {
              if (t[0] & 1) throw t[1];
              return t[1];
            }, trys: [], ops: [] }, f, y, t, g;
            return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() {
              return this;
            }), g;
            function verb(n) {
              return function(v) {
                return step([n, v]);
              };
            }
            function step(op) {
              if (f) throw new TypeError("Generator is already executing.");
              while (_) try {
                if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
                if (y = 0, t) op = [op[0] & 2, t.value];
                switch (op[0]) {
                  case 0:
                  case 1:
                    t = op;
                    break;
                  case 4:
                    _.label++;
                    return { value: op[1], done: false };
                  case 5:
                    _.label++;
                    y = op[1];
                    op = [0];
                    continue;
                  case 7:
                    op = _.ops.pop();
                    _.trys.pop();
                    continue;
                  default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) {
                      _ = 0;
                      continue;
                    }
                    if (op[0] === 3 && (!t || op[1] > t[0] && op[1] < t[3])) {
                      _.label = op[1];
                      break;
                    }
                    if (op[0] === 6 && _.label < t[1]) {
                      _.label = t[1];
                      t = op;
                      break;
                    }
                    if (t && _.label < t[2]) {
                      _.label = t[2];
                      _.ops.push(op);
                      break;
                    }
                    if (t[2]) _.ops.pop();
                    _.trys.pop();
                    continue;
                }
                op = body.call(thisArg, _);
              } catch (e) {
                op = [6, e];
                y = 0;
              } finally {
                f = t = 0;
              }
              if (op[0] & 5) throw op[1];
              return { value: op[0] ? op[1] : void 0, done: true };
            }
          }
          var __createBinding = Object.create ? (function(o, m, k, k2) {
            if (k2 === void 0) k2 = k;
            var desc = Object.getOwnPropertyDescriptor(m, k);
            if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
              desc = { enumerable: true, get: function() {
                return m[k];
              } };
            }
            Object.defineProperty(o, k2, desc);
          }) : (function(o, m, k, k2) {
            if (k2 === void 0) k2 = k;
            o[k2] = m[k];
          });
          function __exportStar(m, o) {
            for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(o, p)) __createBinding(o, m, p);
          }
          function __values(o) {
            var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
            if (m) return m.call(o);
            if (o && typeof o.length === "number") return {
              next: function() {
                if (o && i >= o.length) o = void 0;
                return { value: o && o[i++], done: !o };
              }
            };
            throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
          }
          function __read(o, n) {
            var m = typeof Symbol === "function" && o[Symbol.iterator];
            if (!m) return o;
            var i = m.call(o), r, ar = [], e;
            try {
              while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
            } catch (error) {
              e = { error };
            } finally {
              try {
                if (r && !r.done && (m = i["return"])) m.call(i);
              } finally {
                if (e) throw e.error;
              }
            }
            return ar;
          }
          function __spread() {
            for (var ar = [], i = 0; i < arguments.length; i++)
              ar = ar.concat(__read(arguments[i]));
            return ar;
          }
          function __spreadArrays() {
            for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
            for (var r = Array(s), k = 0, i = 0; i < il; i++)
              for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
                r[k] = a[j];
            return r;
          }
          function __spreadArray(to, from, pack) {
            if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
              if (ar || !(i in from)) {
                if (!ar) ar = Array.prototype.slice.call(from, 0, i);
                ar[i] = from[i];
              }
            }
            return to.concat(ar || Array.prototype.slice.call(from));
          }
          function __await(v) {
            return this instanceof __await ? (this.v = v, this) : new __await(v);
          }
          function __asyncGenerator(thisArg, _arguments, generator) {
            if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
            var g = generator.apply(thisArg, _arguments || []), i, q = [];
            return i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function() {
              return this;
            }, i;
            function verb(n) {
              if (g[n]) i[n] = function(v) {
                return new Promise(function(a, b) {
                  q.push([n, v, a, b]) > 1 || resume(n, v);
                });
              };
            }
            function resume(n, v) {
              try {
                step(g[n](v));
              } catch (e) {
                settle(q[0][3], e);
              }
            }
            function step(r) {
              r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r);
            }
            function fulfill(value) {
              resume("next", value);
            }
            function reject(value) {
              resume("throw", value);
            }
            function settle(f, v) {
              if (f(v), q.shift(), q.length) resume(q[0][0], q[0][1]);
            }
          }
          function __asyncDelegator(o) {
            var i, p;
            return i = {}, verb("next"), verb("throw", function(e) {
              throw e;
            }), verb("return"), i[Symbol.iterator] = function() {
              return this;
            }, i;
            function verb(n, f) {
              i[n] = o[n] ? function(v) {
                return (p = !p) ? { value: __await(o[n](v)), done: n === "return" } : f ? f(v) : v;
              } : f;
            }
          }
          function __asyncValues(o) {
            if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
            var m = o[Symbol.asyncIterator], i;
            return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function() {
              return this;
            }, i);
            function verb(n) {
              i[n] = o[n] && function(v) {
                return new Promise(function(resolve, reject) {
                  v = o[n](v), settle(resolve, reject, v.done, v.value);
                });
              };
            }
            function settle(resolve, reject, d, v) {
              Promise.resolve(v).then(function(v2) {
                resolve({ value: v2, done: d });
              }, reject);
            }
          }
          function __makeTemplateObject(cooked, raw) {
            if (Object.defineProperty) {
              Object.defineProperty(cooked, "raw", { value: raw });
            } else {
              cooked.raw = raw;
            }
            return cooked;
          }
          ;
          var __setModuleDefault = Object.create ? (function(o, v) {
            Object.defineProperty(o, "default", { enumerable: true, value: v });
          }) : function(o, v) {
            o["default"] = v;
          };
          function __importStar(mod) {
            if (mod && mod.__esModule) return mod;
            var result = {};
            if (mod != null) {
              for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
            }
            __setModuleDefault(result, mod);
            return result;
          }
          function __importDefault(mod) {
            return mod && mod.__esModule ? mod : { default: mod };
          }
          function __classPrivateFieldGet(receiver, state, kind, f) {
            if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
            if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
            return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
          }
          function __classPrivateFieldSet(receiver, state, value, kind, f) {
            if (kind === "m") throw new TypeError("Private method is not writable");
            if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
            if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
            return kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value), value;
          }
          function __classPrivateFieldIn(state, receiver) {
            if (receiver === null || typeof receiver !== "object" && typeof receiver !== "function") throw new TypeError("Cannot use 'in' operator on non-object");
            return typeof state === "function" ? receiver === state : state.has(receiver);
          }
          ;
          var CallbackIterResult = (
            /** @class */
            (function(_super) {
              __extends(CallbackIterResult2, _super);
              function CallbackIterResult2(method, args, iterator) {
                var _this = _super.call(this, method, args) || this;
                _this.iterator = iterator;
                return _this;
              }
              CallbackIterResult2.prototype.add = function(date) {
                if (this.iterator(date, this._result.length)) {
                  this._result.push(date);
                  return true;
                }
                return false;
              };
              return CallbackIterResult2;
            })(iterresult)
          );
          const callbackiterresult = CallbackIterResult;
          ;
          var ENGLISH = {
            dayNames: [
              "Sunday",
              "Monday",
              "Tuesday",
              "Wednesday",
              "Thursday",
              "Friday",
              "Saturday"
            ],
            monthNames: [
              "January",
              "February",
              "March",
              "April",
              "May",
              "June",
              "July",
              "August",
              "September",
              "October",
              "November",
              "December"
            ],
            tokens: {
              SKIP: /^[ \r\n\t]+|^\.$/,
              number: /^[1-9][0-9]*/,
              numberAsText: /^(one|two|three)/i,
              every: /^every/i,
              "day(s)": /^days?/i,
              "weekday(s)": /^weekdays?/i,
              "week(s)": /^weeks?/i,
              "hour(s)": /^hours?/i,
              "minute(s)": /^minutes?/i,
              "month(s)": /^months?/i,
              "year(s)": /^years?/i,
              on: /^(on|in)/i,
              at: /^(at)/i,
              the: /^the/i,
              first: /^first/i,
              second: /^second/i,
              third: /^third/i,
              nth: /^([1-9][0-9]*)(\.|th|nd|rd|st)/i,
              last: /^last/i,
              for: /^for/i,
              "time(s)": /^times?/i,
              until: /^(un)?til/i,
              monday: /^mo(n(day)?)?/i,
              tuesday: /^tu(e(s(day)?)?)?/i,
              wednesday: /^we(d(n(esday)?)?)?/i,
              thursday: /^th(u(r(sday)?)?)?/i,
              friday: /^fr(i(day)?)?/i,
              saturday: /^sa(t(urday)?)?/i,
              sunday: /^su(n(day)?)?/i,
              january: /^jan(uary)?/i,
              february: /^feb(ruary)?/i,
              march: /^mar(ch)?/i,
              april: /^apr(il)?/i,
              may: /^may/i,
              june: /^june?/i,
              july: /^july?/i,
              august: /^aug(ust)?/i,
              september: /^sep(t(ember)?)?/i,
              october: /^oct(ober)?/i,
              november: /^nov(ember)?/i,
              december: /^dec(ember)?/i,
              comma: /^(,\s*|(and|or)\s*)+/i
            }
          };
          const i18n = ENGLISH;
          ;
          var contains = function(arr, val) {
            return arr.indexOf(val) !== -1;
          };
          var defaultGetText = function(id) {
            return id.toString();
          };
          var defaultDateFormatter = function(year, month, day) {
            return "".concat(month, " ").concat(day, ", ").concat(year);
          };
          var ToText = (
            /** @class */
            (function() {
              function ToText2(rrule, gettext, language, dateFormatter) {
                if (gettext === void 0) {
                  gettext = defaultGetText;
                }
                if (language === void 0) {
                  language = i18n;
                }
                if (dateFormatter === void 0) {
                  dateFormatter = defaultDateFormatter;
                }
                this.text = [];
                this.language = language || i18n;
                this.gettext = gettext;
                this.dateFormatter = dateFormatter;
                this.rrule = rrule;
                this.options = rrule.options;
                this.origOptions = rrule.origOptions;
                if (this.origOptions.bymonthday) {
                  var bymonthday = [].concat(this.options.bymonthday);
                  var bynmonthday = [].concat(this.options.bynmonthday);
                  bymonthday.sort(function(a, b) {
                    return a - b;
                  });
                  bynmonthday.sort(function(a, b) {
                    return b - a;
                  });
                  this.bymonthday = bymonthday.concat(bynmonthday);
                  if (!this.bymonthday.length)
                    this.bymonthday = null;
                }
                if (isPresent(this.origOptions.byweekday)) {
                  var byweekday = !isArray(this.origOptions.byweekday) ? [this.origOptions.byweekday] : this.origOptions.byweekday;
                  var days = String(byweekday);
                  this.byweekday = {
                    allWeeks: byweekday.filter(function(weekday) {
                      return !weekday.n;
                    }),
                    someWeeks: byweekday.filter(function(weekday) {
                      return Boolean(weekday.n);
                    }),
                    isWeekdays: days.indexOf("MO") !== -1 && days.indexOf("TU") !== -1 && days.indexOf("WE") !== -1 && days.indexOf("TH") !== -1 && days.indexOf("FR") !== -1 && days.indexOf("SA") === -1 && days.indexOf("SU") === -1,
                    isEveryDay: days.indexOf("MO") !== -1 && days.indexOf("TU") !== -1 && days.indexOf("WE") !== -1 && days.indexOf("TH") !== -1 && days.indexOf("FR") !== -1 && days.indexOf("SA") !== -1 && days.indexOf("SU") !== -1
                  };
                  var sortWeekDays = function(a, b) {
                    return a.weekday - b.weekday;
                  };
                  this.byweekday.allWeeks.sort(sortWeekDays);
                  this.byweekday.someWeeks.sort(sortWeekDays);
                  if (!this.byweekday.allWeeks.length)
                    this.byweekday.allWeeks = null;
                  if (!this.byweekday.someWeeks.length)
                    this.byweekday.someWeeks = null;
                } else {
                  this.byweekday = null;
                }
              }
              ToText2.isFullyConvertible = function(rrule) {
                var canConvert = true;
                if (!(rrule.options.freq in ToText2.IMPLEMENTED))
                  return false;
                if (rrule.origOptions.until && rrule.origOptions.count)
                  return false;
                for (var key in rrule.origOptions) {
                  if (contains(["dtstart", "tzid", "wkst", "freq"], key))
                    return true;
                  if (!contains(ToText2.IMPLEMENTED[rrule.options.freq], key))
                    return false;
                }
                return canConvert;
              };
              ToText2.prototype.isFullyConvertible = function() {
                return ToText2.isFullyConvertible(this.rrule);
              };
              ToText2.prototype.toString = function() {
                var gettext = this.gettext;
                if (!(this.options.freq in ToText2.IMPLEMENTED)) {
                  return gettext("RRule error: Unable to fully convert this rrule to text");
                }
                this.text = [gettext("every")];
                this[RRule2.FREQUENCIES[this.options.freq]]();
                if (this.options.until) {
                  this.add(gettext("until"));
                  var until = this.options.until;
                  this.add(this.dateFormatter(until.getUTCFullYear(), this.language.monthNames[until.getUTCMonth()], until.getUTCDate()));
                } else if (this.options.count) {
                  this.add(gettext("for")).add(this.options.count.toString()).add(this.plural(this.options.count) ? gettext("times") : gettext("time"));
                }
                if (!this.isFullyConvertible())
                  this.add(gettext("(~ approximate)"));
                return this.text.join("");
              };
              ToText2.prototype.HOURLY = function() {
                var gettext = this.gettext;
                if (this.options.interval !== 1)
                  this.add(this.options.interval.toString());
                this.add(this.plural(this.options.interval) ? gettext("hours") : gettext("hour"));
              };
              ToText2.prototype.MINUTELY = function() {
                var gettext = this.gettext;
                if (this.options.interval !== 1)
                  this.add(this.options.interval.toString());
                this.add(this.plural(this.options.interval) ? gettext("minutes") : gettext("minute"));
              };
              ToText2.prototype.DAILY = function() {
                var gettext = this.gettext;
                if (this.options.interval !== 1)
                  this.add(this.options.interval.toString());
                if (this.byweekday && this.byweekday.isWeekdays) {
                  this.add(this.plural(this.options.interval) ? gettext("weekdays") : gettext("weekday"));
                } else {
                  this.add(this.plural(this.options.interval) ? gettext("days") : gettext("day"));
                }
                if (this.origOptions.bymonth) {
                  this.add(gettext("in"));
                  this._bymonth();
                }
                if (this.bymonthday) {
                  this._bymonthday();
                } else if (this.byweekday) {
                  this._byweekday();
                } else if (this.origOptions.byhour) {
                  this._byhour();
                }
              };
              ToText2.prototype.WEEKLY = function() {
                var gettext = this.gettext;
                if (this.options.interval !== 1) {
                  this.add(this.options.interval.toString()).add(this.plural(this.options.interval) ? gettext("weeks") : gettext("week"));
                }
                if (this.byweekday && this.byweekday.isWeekdays) {
                  if (this.options.interval === 1) {
                    this.add(this.plural(this.options.interval) ? gettext("weekdays") : gettext("weekday"));
                  } else {
                    this.add(gettext("on")).add(gettext("weekdays"));
                  }
                } else if (this.byweekday && this.byweekday.isEveryDay) {
                  this.add(this.plural(this.options.interval) ? gettext("days") : gettext("day"));
                } else {
                  if (this.options.interval === 1)
                    this.add(gettext("week"));
                  if (this.origOptions.bymonth) {
                    this.add(gettext("in"));
                    this._bymonth();
                  }
                  if (this.bymonthday) {
                    this._bymonthday();
                  } else if (this.byweekday) {
                    this._byweekday();
                  }
                  if (this.origOptions.byhour) {
                    this._byhour();
                  }
                }
              };
              ToText2.prototype.MONTHLY = function() {
                var gettext = this.gettext;
                if (this.origOptions.bymonth) {
                  if (this.options.interval !== 1) {
                    this.add(this.options.interval.toString()).add(gettext("months"));
                    if (this.plural(this.options.interval))
                      this.add(gettext("in"));
                  } else {
                  }
                  this._bymonth();
                } else {
                  if (this.options.interval !== 1) {
                    this.add(this.options.interval.toString());
                  }
                  this.add(this.plural(this.options.interval) ? gettext("months") : gettext("month"));
                }
                if (this.bymonthday) {
                  this._bymonthday();
                } else if (this.byweekday && this.byweekday.isWeekdays) {
                  this.add(gettext("on")).add(gettext("weekdays"));
                } else if (this.byweekday) {
                  this._byweekday();
                }
              };
              ToText2.prototype.YEARLY = function() {
                var gettext = this.gettext;
                if (this.origOptions.bymonth) {
                  if (this.options.interval !== 1) {
                    this.add(this.options.interval.toString());
                    this.add(gettext("years"));
                  } else {
                  }
                  this._bymonth();
                } else {
                  if (this.options.interval !== 1) {
                    this.add(this.options.interval.toString());
                  }
                  this.add(this.plural(this.options.interval) ? gettext("years") : gettext("year"));
                }
                if (this.bymonthday) {
                  this._bymonthday();
                } else if (this.byweekday) {
                  this._byweekday();
                }
                if (this.options.byyearday) {
                  this.add(gettext("on the")).add(this.list(this.options.byyearday, this.nth, gettext("and"))).add(gettext("day"));
                }
                if (this.options.byweekno) {
                  this.add(gettext("in")).add(this.plural(this.options.byweekno.length) ? gettext("weeks") : gettext("week")).add(this.list(this.options.byweekno, void 0, gettext("and")));
                }
              };
              ToText2.prototype._bymonthday = function() {
                var gettext = this.gettext;
                if (this.byweekday && this.byweekday.allWeeks) {
                  this.add(gettext("on")).add(this.list(this.byweekday.allWeeks, this.weekdaytext, gettext("or"))).add(gettext("the")).add(this.list(this.bymonthday, this.nth, gettext("or")));
                } else {
                  this.add(gettext("on the")).add(this.list(this.bymonthday, this.nth, gettext("and")));
                }
              };
              ToText2.prototype._byweekday = function() {
                var gettext = this.gettext;
                if (this.byweekday.allWeeks && !this.byweekday.isWeekdays) {
                  this.add(gettext("on")).add(this.list(this.byweekday.allWeeks, this.weekdaytext));
                }
                if (this.byweekday.someWeeks) {
                  if (this.byweekday.allWeeks)
                    this.add(gettext("and"));
                  this.add(gettext("on the")).add(this.list(this.byweekday.someWeeks, this.weekdaytext, gettext("and")));
                }
              };
              ToText2.prototype._byhour = function() {
                var gettext = this.gettext;
                this.add(gettext("at")).add(this.list(this.origOptions.byhour, void 0, gettext("and")));
              };
              ToText2.prototype._bymonth = function() {
                this.add(this.list(this.options.bymonth, this.monthtext, this.gettext("and")));
              };
              ToText2.prototype.nth = function(n) {
                n = parseInt(n.toString(), 10);
                var nth;
                var gettext = this.gettext;
                if (n === -1)
                  return gettext("last");
                var npos = Math.abs(n);
                switch (npos) {
                  case 1:
                  case 21:
                  case 31:
                    nth = npos + gettext("st");
                    break;
                  case 2:
                  case 22:
                    nth = npos + gettext("nd");
                    break;
                  case 3:
                  case 23:
                    nth = npos + gettext("rd");
                    break;
                  default:
                    nth = npos + gettext("th");
                }
                return n < 0 ? nth + " " + gettext("last") : nth;
              };
              ToText2.prototype.monthtext = function(m) {
                return this.language.monthNames[m - 1];
              };
              ToText2.prototype.weekdaytext = function(wday) {
                var weekday = isNumber(wday) ? (wday + 1) % 7 : wday.getJsWeekday();
                return (wday.n ? this.nth(wday.n) + " " : "") + this.language.dayNames[weekday];
              };
              ToText2.prototype.plural = function(n) {
                return n % 100 !== 1;
              };
              ToText2.prototype.add = function(s) {
                this.text.push(" ");
                this.text.push(s);
                return this;
              };
              ToText2.prototype.list = function(arr, callback, finalDelim, delim) {
                var _this = this;
                if (delim === void 0) {
                  delim = ",";
                }
                if (!isArray(arr)) {
                  arr = [arr];
                }
                var delimJoin = function(array, delimiter, finalDelimiter) {
                  var list = "";
                  for (var i = 0; i < array.length; i++) {
                    if (i !== 0) {
                      if (i === array.length - 1) {
                        list += " " + finalDelimiter + " ";
                      } else {
                        list += delimiter + " ";
                      }
                    }
                    list += array[i];
                  }
                  return list;
                };
                callback = callback || function(o) {
                  return o.toString();
                };
                var realCallback = function(arg) {
                  return callback && callback.call(_this, arg);
                };
                if (finalDelim) {
                  return delimJoin(arr.map(realCallback), delim, finalDelim);
                } else {
                  return arr.map(realCallback).join(delim + " ");
                }
              };
              return ToText2;
            })()
          );
          const totext = ToText;
          ;
          var Parser = (
            /** @class */
            (function() {
              function Parser2(rules) {
                this.done = true;
                this.rules = rules;
              }
              Parser2.prototype.start = function(text) {
                this.text = text;
                this.done = false;
                return this.nextSymbol();
              };
              Parser2.prototype.isDone = function() {
                return this.done && this.symbol === null;
              };
              Parser2.prototype.nextSymbol = function() {
                var best;
                var bestSymbol;
                this.symbol = null;
                this.value = null;
                do {
                  if (this.done)
                    return false;
                  var rule = void 0;
                  best = null;
                  for (var name_1 in this.rules) {
                    rule = this.rules[name_1];
                    var match = rule.exec(this.text);
                    if (match) {
                      if (best === null || match[0].length > best[0].length) {
                        best = match;
                        bestSymbol = name_1;
                      }
                    }
                  }
                  if (best != null) {
                    this.text = this.text.substr(best[0].length);
                    if (this.text === "")
                      this.done = true;
                  }
                  if (best == null) {
                    this.done = true;
                    this.symbol = null;
                    this.value = null;
                    return;
                  }
                } while (bestSymbol === "SKIP");
                this.symbol = bestSymbol;
                this.value = best;
                return true;
              };
              Parser2.prototype.accept = function(name) {
                if (this.symbol === name) {
                  if (this.value) {
                    var v = this.value;
                    this.nextSymbol();
                    return v;
                  }
                  this.nextSymbol();
                  return true;
                }
                return false;
              };
              Parser2.prototype.acceptNumber = function() {
                return this.accept("number");
              };
              Parser2.prototype.expect = function(name) {
                if (this.accept(name))
                  return true;
                throw new Error("expected " + name + " but found " + this.symbol);
              };
              return Parser2;
            })()
          );
          function parseText(text, language) {
            if (language === void 0) {
              language = i18n;
            }
            var options = {};
            var ttr = new Parser(language.tokens);
            if (!ttr.start(text))
              return null;
            S();
            return options;
            function S() {
              ttr.expect("every");
              var n = ttr.acceptNumber();
              if (n)
                options.interval = parseInt(n[0], 10);
              if (ttr.isDone())
                throw new Error("Unexpected end");
              switch (ttr.symbol) {
                case "day(s)":
                  options.freq = RRule2.DAILY;
                  if (ttr.nextSymbol()) {
                    AT();
                    F();
                  }
                  break;
                // FIXME Note: every 2 weekdays != every two weeks on weekdays.
                // DAILY on weekdays is not a valid rule
                case "weekday(s)":
                  options.freq = RRule2.WEEKLY;
                  options.byweekday = [RRule2.MO, RRule2.TU, RRule2.WE, RRule2.TH, RRule2.FR];
                  ttr.nextSymbol();
                  AT();
                  F();
                  break;
                case "week(s)":
                  options.freq = RRule2.WEEKLY;
                  if (ttr.nextSymbol()) {
                    ON();
                    AT();
                    F();
                  }
                  break;
                case "hour(s)":
                  options.freq = RRule2.HOURLY;
                  if (ttr.nextSymbol()) {
                    ON();
                    F();
                  }
                  break;
                case "minute(s)":
                  options.freq = RRule2.MINUTELY;
                  if (ttr.nextSymbol()) {
                    ON();
                    F();
                  }
                  break;
                case "month(s)":
                  options.freq = RRule2.MONTHLY;
                  if (ttr.nextSymbol()) {
                    ON();
                    F();
                  }
                  break;
                case "year(s)":
                  options.freq = RRule2.YEARLY;
                  if (ttr.nextSymbol()) {
                    ON();
                    F();
                  }
                  break;
                case "monday":
                case "tuesday":
                case "wednesday":
                case "thursday":
                case "friday":
                case "saturday":
                case "sunday":
                  options.freq = RRule2.WEEKLY;
                  var key = ttr.symbol.substr(0, 2).toUpperCase();
                  options.byweekday = [RRule2[key]];
                  if (!ttr.nextSymbol())
                    return;
                  while (ttr.accept("comma")) {
                    if (ttr.isDone())
                      throw new Error("Unexpected end");
                    var wkd = decodeWKD();
                    if (!wkd) {
                      throw new Error("Unexpected symbol " + ttr.symbol + ", expected weekday");
                    }
                    options.byweekday.push(RRule2[wkd]);
                    ttr.nextSymbol();
                  }
                  AT();
                  MDAYs();
                  F();
                  break;
                case "january":
                case "february":
                case "march":
                case "april":
                case "may":
                case "june":
                case "july":
                case "august":
                case "september":
                case "october":
                case "november":
                case "december":
                  options.freq = RRule2.YEARLY;
                  options.bymonth = [decodeM()];
                  if (!ttr.nextSymbol())
                    return;
                  while (ttr.accept("comma")) {
                    if (ttr.isDone())
                      throw new Error("Unexpected end");
                    var m = decodeM();
                    if (!m) {
                      throw new Error("Unexpected symbol " + ttr.symbol + ", expected month");
                    }
                    options.bymonth.push(m);
                    ttr.nextSymbol();
                  }
                  ON();
                  F();
                  break;
                default:
                  throw new Error("Unknown symbol");
              }
            }
            function ON() {
              var on = ttr.accept("on");
              var the = ttr.accept("the");
              if (!(on || the))
                return;
              do {
                var nth = decodeNTH();
                var wkd = decodeWKD();
                var m = decodeM();
                if (nth) {
                  if (wkd) {
                    ttr.nextSymbol();
                    if (!options.byweekday)
                      options.byweekday = [];
                    options.byweekday.push(RRule2[wkd].nth(nth));
                  } else {
                    if (!options.bymonthday)
                      options.bymonthday = [];
                    options.bymonthday.push(nth);
                    ttr.accept("day(s)");
                  }
                } else if (wkd) {
                  ttr.nextSymbol();
                  if (!options.byweekday)
                    options.byweekday = [];
                  options.byweekday.push(RRule2[wkd]);
                } else if (ttr.symbol === "weekday(s)") {
                  ttr.nextSymbol();
                  if (!options.byweekday) {
                    options.byweekday = [RRule2.MO, RRule2.TU, RRule2.WE, RRule2.TH, RRule2.FR];
                  }
                } else if (ttr.symbol === "week(s)") {
                  ttr.nextSymbol();
                  var n = ttr.acceptNumber();
                  if (!n) {
                    throw new Error("Unexpected symbol " + ttr.symbol + ", expected week number");
                  }
                  options.byweekno = [parseInt(n[0], 10)];
                  while (ttr.accept("comma")) {
                    n = ttr.acceptNumber();
                    if (!n) {
                      throw new Error("Unexpected symbol " + ttr.symbol + "; expected monthday");
                    }
                    options.byweekno.push(parseInt(n[0], 10));
                  }
                } else if (m) {
                  ttr.nextSymbol();
                  if (!options.bymonth)
                    options.bymonth = [];
                  options.bymonth.push(m);
                } else {
                  return;
                }
              } while (ttr.accept("comma") || ttr.accept("the") || ttr.accept("on"));
            }
            function AT() {
              var at = ttr.accept("at");
              if (!at)
                return;
              do {
                var n = ttr.acceptNumber();
                if (!n) {
                  throw new Error("Unexpected symbol " + ttr.symbol + ", expected hour");
                }
                options.byhour = [parseInt(n[0], 10)];
                while (ttr.accept("comma")) {
                  n = ttr.acceptNumber();
                  if (!n) {
                    throw new Error("Unexpected symbol " + ttr.symbol + "; expected hour");
                  }
                  options.byhour.push(parseInt(n[0], 10));
                }
              } while (ttr.accept("comma") || ttr.accept("at"));
            }
            function decodeM() {
              switch (ttr.symbol) {
                case "january":
                  return 1;
                case "february":
                  return 2;
                case "march":
                  return 3;
                case "april":
                  return 4;
                case "may":
                  return 5;
                case "june":
                  return 6;
                case "july":
                  return 7;
                case "august":
                  return 8;
                case "september":
                  return 9;
                case "october":
                  return 10;
                case "november":
                  return 11;
                case "december":
                  return 12;
                default:
                  return false;
              }
            }
            function decodeWKD() {
              switch (ttr.symbol) {
                case "monday":
                case "tuesday":
                case "wednesday":
                case "thursday":
                case "friday":
                case "saturday":
                case "sunday":
                  return ttr.symbol.substr(0, 2).toUpperCase();
                default:
                  return false;
              }
            }
            function decodeNTH() {
              switch (ttr.symbol) {
                case "last":
                  ttr.nextSymbol();
                  return -1;
                case "first":
                  ttr.nextSymbol();
                  return 1;
                case "second":
                  ttr.nextSymbol();
                  return ttr.accept("last") ? -2 : 2;
                case "third":
                  ttr.nextSymbol();
                  return ttr.accept("last") ? -3 : 3;
                case "nth":
                  var v = parseInt(ttr.value[1], 10);
                  if (v < -366 || v > 366)
                    throw new Error("Nth out of range: " + v);
                  ttr.nextSymbol();
                  return ttr.accept("last") ? -v : v;
                default:
                  return false;
              }
            }
            function MDAYs() {
              ttr.accept("on");
              ttr.accept("the");
              var nth = decodeNTH();
              if (!nth)
                return;
              options.bymonthday = [nth];
              ttr.nextSymbol();
              while (ttr.accept("comma")) {
                nth = decodeNTH();
                if (!nth) {
                  throw new Error("Unexpected symbol " + ttr.symbol + "; expected monthday");
                }
                options.bymonthday.push(nth);
                ttr.nextSymbol();
              }
            }
            function F() {
              if (ttr.symbol === "until") {
                var date = Date.parse(ttr.text);
                if (!date)
                  throw new Error("Cannot parse until date:" + ttr.text);
                options.until = new Date(date);
              } else if (ttr.accept("for")) {
                options.count = parseInt(ttr.value[0], 10);
                ttr.expect("number");
              }
            }
          }
          ;
          var Frequency;
          (function(Frequency2) {
            Frequency2[Frequency2["YEARLY"] = 0] = "YEARLY";
            Frequency2[Frequency2["MONTHLY"] = 1] = "MONTHLY";
            Frequency2[Frequency2["WEEKLY"] = 2] = "WEEKLY";
            Frequency2[Frequency2["DAILY"] = 3] = "DAILY";
            Frequency2[Frequency2["HOURLY"] = 4] = "HOURLY";
            Frequency2[Frequency2["MINUTELY"] = 5] = "MINUTELY";
            Frequency2[Frequency2["SECONDLY"] = 6] = "SECONDLY";
          })(Frequency || (Frequency = {}));
          function freqIsDailyOrGreater(freq) {
            return freq < Frequency.HOURLY;
          }
          ;
          var fromText = function(text, language) {
            if (language === void 0) {
              language = i18n;
            }
            return new RRule2(parseText(text, language) || void 0);
          };
          var common = [
            "count",
            "until",
            "interval",
            "byweekday",
            "bymonthday",
            "bymonth"
          ];
          totext.IMPLEMENTED = [];
          totext.IMPLEMENTED[Frequency.HOURLY] = common;
          totext.IMPLEMENTED[Frequency.MINUTELY] = common;
          totext.IMPLEMENTED[Frequency.DAILY] = ["byhour"].concat(common);
          totext.IMPLEMENTED[Frequency.WEEKLY] = common;
          totext.IMPLEMENTED[Frequency.MONTHLY] = common;
          totext.IMPLEMENTED[Frequency.YEARLY] = ["byweekno", "byyearday"].concat(common);
          var toText = function(rrule, gettext, language, dateFormatter) {
            return new totext(rrule, gettext, language, dateFormatter).toString();
          };
          var isFullyConvertible = totext.isFullyConvertible;
          ;
          var Time = (
            /** @class */
            (function() {
              function Time2(hour, minute, second, millisecond) {
                this.hour = hour;
                this.minute = minute;
                this.second = second;
                this.millisecond = millisecond || 0;
              }
              Time2.prototype.getHours = function() {
                return this.hour;
              };
              Time2.prototype.getMinutes = function() {
                return this.minute;
              };
              Time2.prototype.getSeconds = function() {
                return this.second;
              };
              Time2.prototype.getMilliseconds = function() {
                return this.millisecond;
              };
              Time2.prototype.getTime = function() {
                return (this.hour * 60 * 60 + this.minute * 60 + this.second) * 1e3 + this.millisecond;
              };
              return Time2;
            })()
          );
          var DateTime = (
            /** @class */
            (function(_super) {
              __extends(DateTime2, _super);
              function DateTime2(year, month, day, hour, minute, second, millisecond) {
                var _this = _super.call(this, hour, minute, second, millisecond) || this;
                _this.year = year;
                _this.month = month;
                _this.day = day;
                return _this;
              }
              DateTime2.fromDate = function(date) {
                return new this(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate(), date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds(), date.valueOf() % 1e3);
              };
              DateTime2.prototype.getWeekday = function() {
                return getWeekday(new Date(this.getTime()));
              };
              DateTime2.prototype.getTime = function() {
                return new Date(Date.UTC(this.year, this.month - 1, this.day, this.hour, this.minute, this.second, this.millisecond)).getTime();
              };
              DateTime2.prototype.getDay = function() {
                return this.day;
              };
              DateTime2.prototype.getMonth = function() {
                return this.month;
              };
              DateTime2.prototype.getYear = function() {
                return this.year;
              };
              DateTime2.prototype.addYears = function(years) {
                this.year += years;
              };
              DateTime2.prototype.addMonths = function(months) {
                this.month += months;
                if (this.month > 12) {
                  var yearDiv = Math.floor(this.month / 12);
                  var monthMod = pymod(this.month, 12);
                  this.month = monthMod;
                  this.year += yearDiv;
                  if (this.month === 0) {
                    this.month = 12;
                    --this.year;
                  }
                }
              };
              DateTime2.prototype.addWeekly = function(days, wkst) {
                if (wkst > this.getWeekday()) {
                  this.day += -(this.getWeekday() + 1 + (6 - wkst)) + days * 7;
                } else {
                  this.day += -(this.getWeekday() - wkst) + days * 7;
                }
                this.fixDay();
              };
              DateTime2.prototype.addDaily = function(days) {
                this.day += days;
                this.fixDay();
              };
              DateTime2.prototype.addHours = function(hours, filtered, byhour) {
                if (filtered) {
                  this.hour += Math.floor((23 - this.hour) / hours) * hours;
                }
                for (; ; ) {
                  this.hour += hours;
                  var _a = divmod(this.hour, 24), dayDiv = _a.div, hourMod = _a.mod;
                  if (dayDiv) {
                    this.hour = hourMod;
                    this.addDaily(dayDiv);
                  }
                  if (empty(byhour) || includes(byhour, this.hour))
                    break;
                }
              };
              DateTime2.prototype.addMinutes = function(minutes, filtered, byhour, byminute) {
                if (filtered) {
                  this.minute += Math.floor((1439 - (this.hour * 60 + this.minute)) / minutes) * minutes;
                }
                for (; ; ) {
                  this.minute += minutes;
                  var _a = divmod(this.minute, 60), hourDiv = _a.div, minuteMod = _a.mod;
                  if (hourDiv) {
                    this.minute = minuteMod;
                    this.addHours(hourDiv, false, byhour);
                  }
                  if ((empty(byhour) || includes(byhour, this.hour)) && (empty(byminute) || includes(byminute, this.minute))) {
                    break;
                  }
                }
              };
              DateTime2.prototype.addSeconds = function(seconds, filtered, byhour, byminute, bysecond) {
                if (filtered) {
                  this.second += Math.floor((86399 - (this.hour * 3600 + this.minute * 60 + this.second)) / seconds) * seconds;
                }
                for (; ; ) {
                  this.second += seconds;
                  var _a = divmod(this.second, 60), minuteDiv = _a.div, secondMod = _a.mod;
                  if (minuteDiv) {
                    this.second = secondMod;
                    this.addMinutes(minuteDiv, false, byhour, byminute);
                  }
                  if ((empty(byhour) || includes(byhour, this.hour)) && (empty(byminute) || includes(byminute, this.minute)) && (empty(bysecond) || includes(bysecond, this.second))) {
                    break;
                  }
                }
              };
              DateTime2.prototype.fixDay = function() {
                if (this.day <= 28) {
                  return;
                }
                var daysinmonth = monthRange(this.year, this.month - 1)[1];
                if (this.day <= daysinmonth) {
                  return;
                }
                while (this.day > daysinmonth) {
                  this.day -= daysinmonth;
                  ++this.month;
                  if (this.month === 13) {
                    this.month = 1;
                    ++this.year;
                    if (this.year > MAXYEAR) {
                      return;
                    }
                  }
                  daysinmonth = monthRange(this.year, this.month - 1)[1];
                }
              };
              DateTime2.prototype.add = function(options, filtered) {
                var freq = options.freq, interval = options.interval, wkst = options.wkst, byhour = options.byhour, byminute = options.byminute, bysecond = options.bysecond;
                switch (freq) {
                  case Frequency.YEARLY:
                    return this.addYears(interval);
                  case Frequency.MONTHLY:
                    return this.addMonths(interval);
                  case Frequency.WEEKLY:
                    return this.addWeekly(interval, wkst);
                  case Frequency.DAILY:
                    return this.addDaily(interval);
                  case Frequency.HOURLY:
                    return this.addHours(interval, filtered, byhour);
                  case Frequency.MINUTELY:
                    return this.addMinutes(interval, filtered, byhour, byminute);
                  case Frequency.SECONDLY:
                    return this.addSeconds(interval, filtered, byhour, byminute, bysecond);
                }
              };
              return DateTime2;
            })(Time)
          );
          ;
          function initializeOptions(options) {
            var invalid = [];
            var keys = Object.keys(options);
            for (var _i = 0, keys_1 = keys; _i < keys_1.length; _i++) {
              var key = keys_1[_i];
              if (!includes(defaultKeys, key))
                invalid.push(key);
              if (isDate(options[key]) && !isValidDate(options[key])) {
                invalid.push(key);
              }
            }
            if (invalid.length) {
              throw new Error("Invalid options: " + invalid.join(", "));
            }
            return __assign({}, options);
          }
          function parseOptions(options) {
            var opts = __assign(__assign({}, DEFAULT_OPTIONS), initializeOptions(options));
            if (isPresent(opts.byeaster))
              opts.freq = RRule2.YEARLY;
            if (!(isPresent(opts.freq) && RRule2.FREQUENCIES[opts.freq])) {
              throw new Error("Invalid frequency: ".concat(opts.freq, " ").concat(options.freq));
            }
            if (!opts.dtstart)
              opts.dtstart = new Date((/* @__PURE__ */ new Date()).setMilliseconds(0));
            if (!isPresent(opts.wkst)) {
              opts.wkst = RRule2.MO.weekday;
            } else if (isNumber(opts.wkst)) {
            } else {
              opts.wkst = opts.wkst.weekday;
            }
            if (isPresent(opts.bysetpos)) {
              if (isNumber(opts.bysetpos))
                opts.bysetpos = [opts.bysetpos];
              for (var i = 0; i < opts.bysetpos.length; i++) {
                var v = opts.bysetpos[i];
                if (v === 0 || !(v >= -366 && v <= 366)) {
                  throw new Error("bysetpos must be between 1 and 366, or between -366 and -1");
                }
              }
            }
            if (!(Boolean(opts.byweekno) || notEmpty(opts.byweekno) || notEmpty(opts.byyearday) || Boolean(opts.bymonthday) || notEmpty(opts.bymonthday) || isPresent(opts.byweekday) || isPresent(opts.byeaster))) {
              switch (opts.freq) {
                case RRule2.YEARLY:
                  if (!opts.bymonth)
                    opts.bymonth = opts.dtstart.getUTCMonth() + 1;
                  opts.bymonthday = opts.dtstart.getUTCDate();
                  break;
                case RRule2.MONTHLY:
                  opts.bymonthday = opts.dtstart.getUTCDate();
                  break;
                case RRule2.WEEKLY:
                  opts.byweekday = [getWeekday(opts.dtstart)];
                  break;
              }
            }
            if (isPresent(opts.bymonth) && !isArray(opts.bymonth)) {
              opts.bymonth = [opts.bymonth];
            }
            if (isPresent(opts.byyearday) && !isArray(opts.byyearday) && isNumber(opts.byyearday)) {
              opts.byyearday = [opts.byyearday];
            }
            if (!isPresent(opts.bymonthday)) {
              opts.bymonthday = [];
              opts.bynmonthday = [];
            } else if (isArray(opts.bymonthday)) {
              var bymonthday = [];
              var bynmonthday = [];
              for (var i = 0; i < opts.bymonthday.length; i++) {
                var v = opts.bymonthday[i];
                if (v > 0) {
                  bymonthday.push(v);
                } else if (v < 0) {
                  bynmonthday.push(v);
                }
              }
              opts.bymonthday = bymonthday;
              opts.bynmonthday = bynmonthday;
            } else if (opts.bymonthday < 0) {
              opts.bynmonthday = [opts.bymonthday];
              opts.bymonthday = [];
            } else {
              opts.bynmonthday = [];
              opts.bymonthday = [opts.bymonthday];
            }
            if (isPresent(opts.byweekno) && !isArray(opts.byweekno)) {
              opts.byweekno = [opts.byweekno];
            }
            if (!isPresent(opts.byweekday)) {
              opts.bynweekday = null;
            } else if (isNumber(opts.byweekday)) {
              opts.byweekday = [opts.byweekday];
              opts.bynweekday = null;
            } else if (isWeekdayStr(opts.byweekday)) {
              opts.byweekday = [Weekday.fromStr(opts.byweekday).weekday];
              opts.bynweekday = null;
            } else if (opts.byweekday instanceof Weekday) {
              if (!opts.byweekday.n || opts.freq > RRule2.MONTHLY) {
                opts.byweekday = [opts.byweekday.weekday];
                opts.bynweekday = null;
              } else {
                opts.bynweekday = [[opts.byweekday.weekday, opts.byweekday.n]];
                opts.byweekday = null;
              }
            } else {
              var byweekday = [];
              var bynweekday = [];
              for (var i = 0; i < opts.byweekday.length; i++) {
                var wday = opts.byweekday[i];
                if (isNumber(wday)) {
                  byweekday.push(wday);
                  continue;
                } else if (isWeekdayStr(wday)) {
                  byweekday.push(Weekday.fromStr(wday).weekday);
                  continue;
                }
                if (!wday.n || opts.freq > RRule2.MONTHLY) {
                  byweekday.push(wday.weekday);
                } else {
                  bynweekday.push([wday.weekday, wday.n]);
                }
              }
              opts.byweekday = notEmpty(byweekday) ? byweekday : null;
              opts.bynweekday = notEmpty(bynweekday) ? bynweekday : null;
            }
            if (!isPresent(opts.byhour)) {
              opts.byhour = opts.freq < RRule2.HOURLY ? [opts.dtstart.getUTCHours()] : null;
            } else if (isNumber(opts.byhour)) {
              opts.byhour = [opts.byhour];
            }
            if (!isPresent(opts.byminute)) {
              opts.byminute = opts.freq < RRule2.MINUTELY ? [opts.dtstart.getUTCMinutes()] : null;
            } else if (isNumber(opts.byminute)) {
              opts.byminute = [opts.byminute];
            }
            if (!isPresent(opts.bysecond)) {
              opts.bysecond = opts.freq < RRule2.SECONDLY ? [opts.dtstart.getUTCSeconds()] : null;
            } else if (isNumber(opts.bysecond)) {
              opts.bysecond = [opts.bysecond];
            }
            return { parsedOptions: opts };
          }
          function buildTimeset(opts) {
            var millisecondModulo = opts.dtstart.getTime() % 1e3;
            if (!freqIsDailyOrGreater(opts.freq)) {
              return [];
            }
            var timeset = [];
            opts.byhour.forEach(function(hour) {
              opts.byminute.forEach(function(minute) {
                opts.bysecond.forEach(function(second) {
                  timeset.push(new Time(hour, minute, second, millisecondModulo));
                });
              });
            });
            return timeset;
          }
          ;
          function parseString(rfcString) {
            var options = rfcString.split("\n").map(parseLine).filter(function(x) {
              return x !== null;
            });
            return __assign(__assign({}, options[0]), options[1]);
          }
          function parseDtstart(line) {
            var options = {};
            var dtstartWithZone = /DTSTART(?:;TZID=([^:=]+?))?(?::|=)([^;\s]+)/i.exec(line);
            if (!dtstartWithZone) {
              return options;
            }
            var tzid = dtstartWithZone[1], dtstart = dtstartWithZone[2];
            if (tzid) {
              options.tzid = tzid;
            }
            options.dtstart = untilStringToDate(dtstart);
            return options;
          }
          function parseLine(rfcString) {
            rfcString = rfcString.replace(/^\s+|\s+$/, "");
            if (!rfcString.length)
              return null;
            var header = /^([A-Z]+?)[:;]/.exec(rfcString.toUpperCase());
            if (!header) {
              return parseRrule(rfcString);
            }
            var key = header[1];
            switch (key.toUpperCase()) {
              case "RRULE":
              case "EXRULE":
                return parseRrule(rfcString);
              case "DTSTART":
                return parseDtstart(rfcString);
              default:
                throw new Error("Unsupported RFC prop ".concat(key, " in ").concat(rfcString));
            }
          }
          function parseRrule(line) {
            var strippedLine = line.replace(/^RRULE:/i, "");
            var options = parseDtstart(strippedLine);
            var attrs = line.replace(/^(?:RRULE|EXRULE):/i, "").split(";");
            attrs.forEach(function(attr) {
              var _a = attr.split("="), key = _a[0], value = _a[1];
              switch (key.toUpperCase()) {
                case "FREQ":
                  options.freq = Frequency[value.toUpperCase()];
                  break;
                case "WKST":
                  options.wkst = Days[value.toUpperCase()];
                  break;
                case "COUNT":
                case "INTERVAL":
                case "BYSETPOS":
                case "BYMONTH":
                case "BYMONTHDAY":
                case "BYYEARDAY":
                case "BYWEEKNO":
                case "BYHOUR":
                case "BYMINUTE":
                case "BYSECOND":
                  var num = parseNumber(value);
                  var optionKey = key.toLowerCase();
                  options[optionKey] = num;
                  break;
                case "BYWEEKDAY":
                case "BYDAY":
                  options.byweekday = parseWeekday(value);
                  break;
                case "DTSTART":
                case "TZID":
                  var dtstart = parseDtstart(line);
                  options.tzid = dtstart.tzid;
                  options.dtstart = dtstart.dtstart;
                  break;
                case "UNTIL":
                  options.until = untilStringToDate(value);
                  break;
                case "BYEASTER":
                  options.byeaster = Number(value);
                  break;
                default:
                  throw new Error("Unknown RRULE property '" + key + "'");
              }
            });
            return options;
          }
          function parseNumber(value) {
            if (value.indexOf(",") !== -1) {
              var values = value.split(",");
              return values.map(parseIndividualNumber);
            }
            return parseIndividualNumber(value);
          }
          function parseIndividualNumber(value) {
            if (/^[+-]?\d+$/.test(value)) {
              return Number(value);
            }
            return value;
          }
          function parseWeekday(value) {
            var days = value.split(",");
            return days.map(function(day) {
              if (day.length === 2) {
                return Days[day];
              }
              var parts = day.match(/^([+-]?\d{1,2})([A-Z]{2})$/);
              if (!parts || parts.length < 3) {
                throw new SyntaxError("Invalid weekday string: ".concat(day));
              }
              var n = Number(parts[1]);
              var wdaypart = parts[2];
              var wday = Days[wdaypart].weekday;
              return new Weekday(wday, n);
            });
          }
          ;
          var DateWithZone = (
            /** @class */
            (function() {
              function DateWithZone2(date, tzid) {
                if (isNaN(date.getTime())) {
                  throw new RangeError("Invalid date passed to DateWithZone");
                }
                this.date = date;
                this.tzid = tzid;
              }
              Object.defineProperty(DateWithZone2.prototype, "isUTC", {
                get: function() {
                  return !this.tzid || this.tzid.toUpperCase() === "UTC";
                },
                enumerable: false,
                configurable: true
              });
              DateWithZone2.prototype.toString = function() {
                var datestr = timeToUntilString(this.date.getTime(), this.isUTC);
                if (!this.isUTC) {
                  return ";TZID=".concat(this.tzid, ":").concat(datestr);
                }
                return ":".concat(datestr);
              };
              DateWithZone2.prototype.getTime = function() {
                return this.date.getTime();
              };
              DateWithZone2.prototype.rezonedDate = function() {
                if (this.isUTC) {
                  return this.date;
                }
                return dateInTimeZone(this.date, this.tzid);
              };
              return DateWithZone2;
            })()
          );
          ;
          function optionsToString(options) {
            var rrule = [];
            var dtstart = "";
            var keys = Object.keys(options);
            var defaultKeys2 = Object.keys(DEFAULT_OPTIONS);
            for (var i = 0; i < keys.length; i++) {
              if (keys[i] === "tzid")
                continue;
              if (!includes(defaultKeys2, keys[i]))
                continue;
              var key = keys[i].toUpperCase();
              var value = options[keys[i]];
              var outValue = "";
              if (!isPresent(value) || isArray(value) && !value.length)
                continue;
              switch (key) {
                case "FREQ":
                  outValue = RRule2.FREQUENCIES[options.freq];
                  break;
                case "WKST":
                  if (isNumber(value)) {
                    outValue = new Weekday(value).toString();
                  } else {
                    outValue = value.toString();
                  }
                  break;
                case "BYWEEKDAY":
                  key = "BYDAY";
                  outValue = toArray(value).map(function(wday) {
                    if (wday instanceof Weekday) {
                      return wday;
                    }
                    if (isArray(wday)) {
                      return new Weekday(wday[0], wday[1]);
                    }
                    return new Weekday(wday);
                  }).toString();
                  break;
                case "DTSTART":
                  dtstart = buildDtstart(value, options.tzid);
                  break;
                case "UNTIL":
                  outValue = timeToUntilString(value, !options.tzid);
                  break;
                default:
                  if (isArray(value)) {
                    var strValues = [];
                    for (var j = 0; j < value.length; j++) {
                      strValues[j] = String(value[j]);
                    }
                    outValue = strValues.toString();
                  } else {
                    outValue = String(value);
                  }
              }
              if (outValue) {
                rrule.push([key, outValue]);
              }
            }
            var rules = rrule.map(function(_a) {
              var key2 = _a[0], value2 = _a[1];
              return "".concat(key2, "=").concat(value2.toString());
            }).join(";");
            var ruleString = "";
            if (rules !== "") {
              ruleString = "RRULE:".concat(rules);
            }
            return [dtstart, ruleString].filter(function(x) {
              return !!x;
            }).join("\n");
          }
          function buildDtstart(dtstart, tzid) {
            if (!dtstart) {
              return "";
            }
            return "DTSTART" + new DateWithZone(new Date(dtstart), tzid).toString();
          }
          ;
          function argsMatch(left, right) {
            if (Array.isArray(left)) {
              if (!Array.isArray(right))
                return false;
              if (left.length !== right.length)
                return false;
              return left.every(function(date, i) {
                return date.getTime() === right[i].getTime();
              });
            }
            if (left instanceof Date) {
              return right instanceof Date && left.getTime() === right.getTime();
            }
            return left === right;
          }
          var Cache = (
            /** @class */
            (function() {
              function Cache2() {
                this.all = false;
                this.before = [];
                this.after = [];
                this.between = [];
              }
              Cache2.prototype._cacheAdd = function(what, value, args) {
                if (value) {
                  value = value instanceof Date ? dateutil_clone(value) : cloneDates(value);
                }
                if (what === "all") {
                  this.all = value;
                } else {
                  args._value = value;
                  this[what].push(args);
                }
              };
              Cache2.prototype._cacheGet = function(what, args) {
                var cached = false;
                var argsKeys = args ? Object.keys(args) : [];
                var findCacheDiff = function(item2) {
                  for (var i2 = 0; i2 < argsKeys.length; i2++) {
                    var key = argsKeys[i2];
                    if (!argsMatch(args[key], item2[key])) {
                      return true;
                    }
                  }
                  return false;
                };
                var cachedObject = this[what];
                if (what === "all") {
                  cached = this.all;
                } else if (isArray(cachedObject)) {
                  for (var i = 0; i < cachedObject.length; i++) {
                    var item = cachedObject[i];
                    if (argsKeys.length && findCacheDiff(item))
                      continue;
                    cached = item._value;
                    break;
                  }
                }
                if (!cached && this.all) {
                  var iterResult = new iterresult(what, args);
                  for (var i = 0; i < this.all.length; i++) {
                    if (!iterResult.accept(this.all[i]))
                      break;
                  }
                  cached = iterResult.getValue();
                  this._cacheAdd(what, cached, args);
                }
                return isArray(cached) ? cloneDates(cached) : cached instanceof Date ? dateutil_clone(cached) : cached;
              };
              return Cache2;
            })()
          );
          ;
          var M365MASK = __spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray([], repeat(1, 31), true), repeat(2, 28), true), repeat(3, 31), true), repeat(4, 30), true), repeat(5, 31), true), repeat(6, 30), true), repeat(7, 31), true), repeat(8, 31), true), repeat(9, 30), true), repeat(10, 31), true), repeat(11, 30), true), repeat(12, 31), true), repeat(1, 7), true);
          var M366MASK = __spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray([], repeat(1, 31), true), repeat(2, 29), true), repeat(3, 31), true), repeat(4, 30), true), repeat(5, 31), true), repeat(6, 30), true), repeat(7, 31), true), repeat(8, 31), true), repeat(9, 30), true), repeat(10, 31), true), repeat(11, 30), true), repeat(12, 31), true), repeat(1, 7), true);
          var M28 = range(1, 29);
          var M29 = range(1, 30);
          var M30 = range(1, 31);
          var M31 = range(1, 32);
          var MDAY366MASK = __spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray([], M31, true), M29, true), M31, true), M30, true), M31, true), M30, true), M31, true), M31, true), M30, true), M31, true), M30, true), M31, true), M31.slice(0, 7), true);
          var MDAY365MASK = __spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray([], M31, true), M28, true), M31, true), M30, true), M31, true), M30, true), M31, true), M31, true), M30, true), M31, true), M30, true), M31, true), M31.slice(0, 7), true);
          var NM28 = range(-28, 0);
          var NM29 = range(-29, 0);
          var NM30 = range(-30, 0);
          var NM31 = range(-31, 0);
          var NMDAY366MASK = __spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray([], NM31, true), NM29, true), NM31, true), NM30, true), NM31, true), NM30, true), NM31, true), NM31, true), NM30, true), NM31, true), NM30, true), NM31, true), NM31.slice(0, 7), true);
          var NMDAY365MASK = __spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray([], NM31, true), NM28, true), NM31, true), NM30, true), NM31, true), NM30, true), NM31, true), NM31, true), NM30, true), NM31, true), NM30, true), NM31, true), NM31.slice(0, 7), true);
          var M366RANGE = [0, 31, 60, 91, 121, 152, 182, 213, 244, 274, 305, 335, 366];
          var M365RANGE = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334, 365];
          var WDAYMASK = (function() {
            var wdaymask = [];
            for (var i = 0; i < 55; i++)
              wdaymask = wdaymask.concat(range(7));
            return wdaymask;
          })();
          ;
          function rebuildYear(year, options) {
            var firstyday = datetime(year, 1, 1);
            var yearlen = isLeapYear(year) ? 366 : 365;
            var nextyearlen = isLeapYear(year + 1) ? 366 : 365;
            var yearordinal = toOrdinal(firstyday);
            var yearweekday = getWeekday(firstyday);
            var result = __assign(__assign({ yearlen, nextyearlen, yearordinal, yearweekday }, baseYearMasks(year)), { wnomask: null });
            if (empty(options.byweekno)) {
              return result;
            }
            result.wnomask = repeat(0, yearlen + 7);
            var firstwkst;
            var wyearlen;
            var no1wkst = firstwkst = pymod(7 - yearweekday + options.wkst, 7);
            if (no1wkst >= 4) {
              no1wkst = 0;
              wyearlen = result.yearlen + pymod(yearweekday - options.wkst, 7);
            } else {
              wyearlen = yearlen - no1wkst;
            }
            var div = Math.floor(wyearlen / 7);
            var mod = pymod(wyearlen, 7);
            var numweeks = Math.floor(div + mod / 4);
            for (var j = 0; j < options.byweekno.length; j++) {
              var n = options.byweekno[j];
              if (n < 0) {
                n += numweeks + 1;
              }
              if (!(n > 0 && n <= numweeks)) {
                continue;
              }
              var i = void 0;
              if (n > 1) {
                i = no1wkst + (n - 1) * 7;
                if (no1wkst !== firstwkst) {
                  i -= 7 - firstwkst;
                }
              } else {
                i = no1wkst;
              }
              for (var k = 0; k < 7; k++) {
                result.wnomask[i] = 1;
                i++;
                if (result.wdaymask[i] === options.wkst)
                  break;
              }
            }
            if (includes(options.byweekno, 1)) {
              var i = no1wkst + numweeks * 7;
              if (no1wkst !== firstwkst)
                i -= 7 - firstwkst;
              if (i < yearlen) {
                for (var j = 0; j < 7; j++) {
                  result.wnomask[i] = 1;
                  i += 1;
                  if (result.wdaymask[i] === options.wkst)
                    break;
                }
              }
            }
            if (no1wkst) {
              var lnumweeks = void 0;
              if (!includes(options.byweekno, -1)) {
                var lyearweekday = getWeekday(datetime(year - 1, 1, 1));
                var lno1wkst = pymod(7 - lyearweekday.valueOf() + options.wkst, 7);
                var lyearlen = isLeapYear(year - 1) ? 366 : 365;
                var weekst = void 0;
                if (lno1wkst >= 4) {
                  lno1wkst = 0;
                  weekst = lyearlen + pymod(lyearweekday - options.wkst, 7);
                } else {
                  weekst = yearlen - no1wkst;
                }
                lnumweeks = Math.floor(52 + pymod(weekst, 7) / 4);
              } else {
                lnumweeks = -1;
              }
              if (includes(options.byweekno, lnumweeks)) {
                for (var i = 0; i < no1wkst; i++)
                  result.wnomask[i] = 1;
              }
            }
            return result;
          }
          function baseYearMasks(year) {
            var yearlen = isLeapYear(year) ? 366 : 365;
            var firstyday = datetime(year, 1, 1);
            var wday = getWeekday(firstyday);
            if (yearlen === 365) {
              return {
                mmask: M365MASK,
                mdaymask: MDAY365MASK,
                nmdaymask: NMDAY365MASK,
                wdaymask: WDAYMASK.slice(wday),
                mrange: M365RANGE
              };
            }
            return {
              mmask: M366MASK,
              mdaymask: MDAY366MASK,
              nmdaymask: NMDAY366MASK,
              wdaymask: WDAYMASK.slice(wday),
              mrange: M366RANGE
            };
          }
          ;
          function rebuildMonth(year, month, yearlen, mrange, wdaymask, options) {
            var result = {
              lastyear: year,
              lastmonth: month,
              nwdaymask: []
            };
            var ranges = [];
            if (options.freq === RRule2.YEARLY) {
              if (empty(options.bymonth)) {
                ranges = [[0, yearlen]];
              } else {
                for (var j = 0; j < options.bymonth.length; j++) {
                  month = options.bymonth[j];
                  ranges.push(mrange.slice(month - 1, month + 1));
                }
              }
            } else if (options.freq === RRule2.MONTHLY) {
              ranges = [mrange.slice(month - 1, month + 1)];
            }
            if (empty(ranges)) {
              return result;
            }
            result.nwdaymask = repeat(0, yearlen);
            for (var j = 0; j < ranges.length; j++) {
              var rang = ranges[j];
              var first = rang[0];
              var last = rang[1] - 1;
              for (var k = 0; k < options.bynweekday.length; k++) {
                var i = void 0;
                var _a = options.bynweekday[k], wday = _a[0], n = _a[1];
                if (n < 0) {
                  i = last + (n + 1) * 7;
                  i -= pymod(wdaymask[i] - wday, 7);
                } else {
                  i = first + (n - 1) * 7;
                  i += pymod(7 - wdaymask[i] + wday, 7);
                }
                if (first <= i && i <= last)
                  result.nwdaymask[i] = 1;
              }
            }
            return result;
          }
          ;
          function easter(y, offset) {
            if (offset === void 0) {
              offset = 0;
            }
            var a = y % 19;
            var b = Math.floor(y / 100);
            var c = y % 100;
            var d = Math.floor(b / 4);
            var e = b % 4;
            var f = Math.floor((b + 8) / 25);
            var g = Math.floor((b - f + 1) / 3);
            var h = Math.floor(19 * a + b - d - g + 15) % 30;
            var i = Math.floor(c / 4);
            var k = c % 4;
            var l = Math.floor(32 + 2 * e + 2 * i - h - k) % 7;
            var m = Math.floor((a + 11 * h + 22 * l) / 451);
            var month = Math.floor((h + l - 7 * m + 114) / 31);
            var day = (h + l - 7 * m + 114) % 31 + 1;
            var date = Date.UTC(y, month - 1, day + offset);
            var yearStart = Date.UTC(y, 0, 1);
            return [Math.ceil((date - yearStart) / (1e3 * 60 * 60 * 24))];
          }
          ;
          var Iterinfo = (
            /** @class */
            (function() {
              function Iterinfo2(options) {
                this.options = options;
              }
              Iterinfo2.prototype.rebuild = function(year, month) {
                var options = this.options;
                if (year !== this.lastyear) {
                  this.yearinfo = rebuildYear(year, options);
                }
                if (notEmpty(options.bynweekday) && (month !== this.lastmonth || year !== this.lastyear)) {
                  var _a = this.yearinfo, yearlen = _a.yearlen, mrange = _a.mrange, wdaymask = _a.wdaymask;
                  this.monthinfo = rebuildMonth(year, month, yearlen, mrange, wdaymask, options);
                }
                if (isPresent(options.byeaster)) {
                  this.eastermask = easter(year, options.byeaster);
                }
              };
              Object.defineProperty(Iterinfo2.prototype, "lastyear", {
                get: function() {
                  return this.monthinfo ? this.monthinfo.lastyear : null;
                },
                enumerable: false,
                configurable: true
              });
              Object.defineProperty(Iterinfo2.prototype, "lastmonth", {
                get: function() {
                  return this.monthinfo ? this.monthinfo.lastmonth : null;
                },
                enumerable: false,
                configurable: true
              });
              Object.defineProperty(Iterinfo2.prototype, "yearlen", {
                get: function() {
                  return this.yearinfo.yearlen;
                },
                enumerable: false,
                configurable: true
              });
              Object.defineProperty(Iterinfo2.prototype, "yearordinal", {
                get: function() {
                  return this.yearinfo.yearordinal;
                },
                enumerable: false,
                configurable: true
              });
              Object.defineProperty(Iterinfo2.prototype, "mrange", {
                get: function() {
                  return this.yearinfo.mrange;
                },
                enumerable: false,
                configurable: true
              });
              Object.defineProperty(Iterinfo2.prototype, "wdaymask", {
                get: function() {
                  return this.yearinfo.wdaymask;
                },
                enumerable: false,
                configurable: true
              });
              Object.defineProperty(Iterinfo2.prototype, "mmask", {
                get: function() {
                  return this.yearinfo.mmask;
                },
                enumerable: false,
                configurable: true
              });
              Object.defineProperty(Iterinfo2.prototype, "wnomask", {
                get: function() {
                  return this.yearinfo.wnomask;
                },
                enumerable: false,
                configurable: true
              });
              Object.defineProperty(Iterinfo2.prototype, "nwdaymask", {
                get: function() {
                  return this.monthinfo ? this.monthinfo.nwdaymask : [];
                },
                enumerable: false,
                configurable: true
              });
              Object.defineProperty(Iterinfo2.prototype, "nextyearlen", {
                get: function() {
                  return this.yearinfo.nextyearlen;
                },
                enumerable: false,
                configurable: true
              });
              Object.defineProperty(Iterinfo2.prototype, "mdaymask", {
                get: function() {
                  return this.yearinfo.mdaymask;
                },
                enumerable: false,
                configurable: true
              });
              Object.defineProperty(Iterinfo2.prototype, "nmdaymask", {
                get: function() {
                  return this.yearinfo.nmdaymask;
                },
                enumerable: false,
                configurable: true
              });
              Iterinfo2.prototype.ydayset = function() {
                return [range(this.yearlen), 0, this.yearlen];
              };
              Iterinfo2.prototype.mdayset = function(_, month) {
                var start = this.mrange[month - 1];
                var end = this.mrange[month];
                var set = repeat(null, this.yearlen);
                for (var i = start; i < end; i++)
                  set[i] = i;
                return [set, start, end];
              };
              Iterinfo2.prototype.wdayset = function(year, month, day) {
                var set = repeat(null, this.yearlen + 7);
                var i = toOrdinal(datetime(year, month, day)) - this.yearordinal;
                var start = i;
                for (var j = 0; j < 7; j++) {
                  set[i] = i;
                  ++i;
                  if (this.wdaymask[i] === this.options.wkst)
                    break;
                }
                return [set, start, i];
              };
              Iterinfo2.prototype.ddayset = function(year, month, day) {
                var set = repeat(null, this.yearlen);
                var i = toOrdinal(datetime(year, month, day)) - this.yearordinal;
                set[i] = i;
                return [set, i, i + 1];
              };
              Iterinfo2.prototype.htimeset = function(hour, _, second, millisecond) {
                var _this = this;
                var set = [];
                this.options.byminute.forEach(function(minute) {
                  set = set.concat(_this.mtimeset(hour, minute, second, millisecond));
                });
                sort(set);
                return set;
              };
              Iterinfo2.prototype.mtimeset = function(hour, minute, _, millisecond) {
                var set = this.options.bysecond.map(function(second) {
                  return new Time(hour, minute, second, millisecond);
                });
                sort(set);
                return set;
              };
              Iterinfo2.prototype.stimeset = function(hour, minute, second, millisecond) {
                return [new Time(hour, minute, second, millisecond)];
              };
              Iterinfo2.prototype.getdayset = function(freq) {
                switch (freq) {
                  case Frequency.YEARLY:
                    return this.ydayset.bind(this);
                  case Frequency.MONTHLY:
                    return this.mdayset.bind(this);
                  case Frequency.WEEKLY:
                    return this.wdayset.bind(this);
                  case Frequency.DAILY:
                    return this.ddayset.bind(this);
                  default:
                    return this.ddayset.bind(this);
                }
              };
              Iterinfo2.prototype.gettimeset = function(freq) {
                switch (freq) {
                  case Frequency.HOURLY:
                    return this.htimeset.bind(this);
                  case Frequency.MINUTELY:
                    return this.mtimeset.bind(this);
                  case Frequency.SECONDLY:
                    return this.stimeset.bind(this);
                }
              };
              return Iterinfo2;
            })()
          );
          const iterinfo = Iterinfo;
          ;
          function buildPoslist(bysetpos, timeset, start, end, ii, dayset) {
            var poslist = [];
            for (var j = 0; j < bysetpos.length; j++) {
              var daypos = void 0;
              var timepos = void 0;
              var pos = bysetpos[j];
              if (pos < 0) {
                daypos = Math.floor(pos / timeset.length);
                timepos = pymod(pos, timeset.length);
              } else {
                daypos = Math.floor((pos - 1) / timeset.length);
                timepos = pymod(pos - 1, timeset.length);
              }
              var tmp = [];
              for (var k = start; k < end; k++) {
                var val = dayset[k];
                if (!isPresent(val))
                  continue;
                tmp.push(val);
              }
              var i = void 0;
              if (daypos < 0) {
                i = tmp.slice(daypos)[0];
              } else {
                i = tmp[daypos];
              }
              var time = timeset[timepos];
              var date = fromOrdinal(ii.yearordinal + i);
              var res = combine(date, time);
              if (!includes(poslist, res))
                poslist.push(res);
            }
            sort(poslist);
            return poslist;
          }
          ;
          function iter(iterResult, options) {
            var dtstart = options.dtstart, freq = options.freq, interval = options.interval, until = options.until, bysetpos = options.bysetpos;
            var count = options.count;
            if (count === 0 || interval === 0) {
              return emitResult(iterResult);
            }
            var counterDate = DateTime.fromDate(dtstart);
            var ii = new iterinfo(options);
            ii.rebuild(counterDate.year, counterDate.month);
            var timeset = makeTimeset(ii, counterDate, options);
            for (; ; ) {
              var _a = ii.getdayset(freq)(counterDate.year, counterDate.month, counterDate.day), dayset = _a[0], start = _a[1], end = _a[2];
              var filtered = removeFilteredDays(dayset, start, end, ii, options);
              if (notEmpty(bysetpos)) {
                var poslist = buildPoslist(bysetpos, timeset, start, end, ii, dayset);
                for (var j = 0; j < poslist.length; j++) {
                  var res = poslist[j];
                  if (until && res > until) {
                    return emitResult(iterResult);
                  }
                  if (res >= dtstart) {
                    var rezonedDate = rezoneIfNeeded(res, options);
                    if (!iterResult.accept(rezonedDate)) {
                      return emitResult(iterResult);
                    }
                    if (count) {
                      --count;
                      if (!count) {
                        return emitResult(iterResult);
                      }
                    }
                  }
                }
              } else {
                for (var j = start; j < end; j++) {
                  var currentDay = dayset[j];
                  if (!isPresent(currentDay)) {
                    continue;
                  }
                  var date = fromOrdinal(ii.yearordinal + currentDay);
                  for (var k = 0; k < timeset.length; k++) {
                    var time = timeset[k];
                    var res = combine(date, time);
                    if (until && res > until) {
                      return emitResult(iterResult);
                    }
                    if (res >= dtstart) {
                      var rezonedDate = rezoneIfNeeded(res, options);
                      if (!iterResult.accept(rezonedDate)) {
                        return emitResult(iterResult);
                      }
                      if (count) {
                        --count;
                        if (!count) {
                          return emitResult(iterResult);
                        }
                      }
                    }
                  }
                }
              }
              if (options.interval === 0) {
                return emitResult(iterResult);
              }
              counterDate.add(options, filtered);
              if (counterDate.year > MAXYEAR) {
                return emitResult(iterResult);
              }
              if (!freqIsDailyOrGreater(freq)) {
                timeset = ii.gettimeset(freq)(counterDate.hour, counterDate.minute, counterDate.second, 0);
              }
              ii.rebuild(counterDate.year, counterDate.month);
            }
          }
          function isFiltered(ii, currentDay, options) {
            var bymonth = options.bymonth, byweekno = options.byweekno, byweekday = options.byweekday, byeaster = options.byeaster, bymonthday = options.bymonthday, bynmonthday = options.bynmonthday, byyearday = options.byyearday;
            return notEmpty(bymonth) && !includes(bymonth, ii.mmask[currentDay]) || notEmpty(byweekno) && !ii.wnomask[currentDay] || notEmpty(byweekday) && !includes(byweekday, ii.wdaymask[currentDay]) || notEmpty(ii.nwdaymask) && !ii.nwdaymask[currentDay] || byeaster !== null && !includes(ii.eastermask, currentDay) || (notEmpty(bymonthday) || notEmpty(bynmonthday)) && !includes(bymonthday, ii.mdaymask[currentDay]) && !includes(bynmonthday, ii.nmdaymask[currentDay]) || notEmpty(byyearday) && (currentDay < ii.yearlen && !includes(byyearday, currentDay + 1) && !includes(byyearday, -ii.yearlen + currentDay) || currentDay >= ii.yearlen && !includes(byyearday, currentDay + 1 - ii.yearlen) && !includes(byyearday, -ii.nextyearlen + currentDay - ii.yearlen));
          }
          function rezoneIfNeeded(date, options) {
            return new DateWithZone(date, options.tzid).rezonedDate();
          }
          function emitResult(iterResult) {
            return iterResult.getValue();
          }
          function removeFilteredDays(dayset, start, end, ii, options) {
            var filtered = false;
            for (var dayCounter = start; dayCounter < end; dayCounter++) {
              var currentDay = dayset[dayCounter];
              filtered = isFiltered(ii, currentDay, options);
              if (filtered)
                dayset[currentDay] = null;
            }
            return filtered;
          }
          function makeTimeset(ii, counterDate, options) {
            var freq = options.freq, byhour = options.byhour, byminute = options.byminute, bysecond = options.bysecond;
            if (freqIsDailyOrGreater(freq)) {
              return buildTimeset(options);
            }
            if (freq >= RRule2.HOURLY && notEmpty(byhour) && !includes(byhour, counterDate.hour) || freq >= RRule2.MINUTELY && notEmpty(byminute) && !includes(byminute, counterDate.minute) || freq >= RRule2.SECONDLY && notEmpty(bysecond) && !includes(bysecond, counterDate.second)) {
              return [];
            }
            return ii.gettimeset(freq)(counterDate.hour, counterDate.minute, counterDate.second, counterDate.millisecond);
          }
          ;
          var Days = {
            MO: new Weekday(0),
            TU: new Weekday(1),
            WE: new Weekday(2),
            TH: new Weekday(3),
            FR: new Weekday(4),
            SA: new Weekday(5),
            SU: new Weekday(6)
          };
          var DEFAULT_OPTIONS = {
            freq: Frequency.YEARLY,
            dtstart: null,
            interval: 1,
            wkst: Days.MO,
            count: null,
            until: null,
            tzid: null,
            bysetpos: null,
            bymonth: null,
            bymonthday: null,
            bynmonthday: null,
            byyearday: null,
            byweekno: null,
            byweekday: null,
            bynweekday: null,
            byhour: null,
            byminute: null,
            bysecond: null,
            byeaster: null
          };
          var defaultKeys = Object.keys(DEFAULT_OPTIONS);
          var RRule2 = (
            /** @class */
            (function() {
              function RRule3(options, noCache) {
                if (options === void 0) {
                  options = {};
                }
                if (noCache === void 0) {
                  noCache = false;
                }
                this._cache = noCache ? null : new Cache();
                this.origOptions = initializeOptions(options);
                var parsedOptions = parseOptions(options).parsedOptions;
                this.options = parsedOptions;
              }
              RRule3.parseText = function(text, language) {
                return parseText(text, language);
              };
              RRule3.fromText = function(text, language) {
                return fromText(text, language);
              };
              RRule3.fromString = function(str) {
                return new RRule3(RRule3.parseString(str) || void 0);
              };
              RRule3.prototype._iter = function(iterResult) {
                return iter(iterResult, this.options);
              };
              RRule3.prototype._cacheGet = function(what, args) {
                if (!this._cache)
                  return false;
                return this._cache._cacheGet(what, args);
              };
              RRule3.prototype._cacheAdd = function(what, value, args) {
                if (!this._cache)
                  return;
                return this._cache._cacheAdd(what, value, args);
              };
              RRule3.prototype.all = function(iterator) {
                if (iterator) {
                  return this._iter(new callbackiterresult("all", {}, iterator));
                }
                var result = this._cacheGet("all");
                if (result === false) {
                  result = this._iter(new iterresult("all", {}));
                  this._cacheAdd("all", result);
                }
                return result;
              };
              RRule3.prototype.between = function(after, before, inc, iterator) {
                if (inc === void 0) {
                  inc = false;
                }
                if (!isValidDate(after) || !isValidDate(before)) {
                  throw new Error("Invalid date passed in to RRule.between");
                }
                var args = {
                  before,
                  after,
                  inc
                };
                if (iterator) {
                  return this._iter(new callbackiterresult("between", args, iterator));
                }
                var result = this._cacheGet("between", args);
                if (result === false) {
                  result = this._iter(new iterresult("between", args));
                  this._cacheAdd("between", result, args);
                }
                return result;
              };
              RRule3.prototype.before = function(dt, inc) {
                if (inc === void 0) {
                  inc = false;
                }
                if (!isValidDate(dt)) {
                  throw new Error("Invalid date passed in to RRule.before");
                }
                var args = { dt, inc };
                var result = this._cacheGet("before", args);
                if (result === false) {
                  result = this._iter(new iterresult("before", args));
                  this._cacheAdd("before", result, args);
                }
                return result;
              };
              RRule3.prototype.after = function(dt, inc) {
                if (inc === void 0) {
                  inc = false;
                }
                if (!isValidDate(dt)) {
                  throw new Error("Invalid date passed in to RRule.after");
                }
                var args = { dt, inc };
                var result = this._cacheGet("after", args);
                if (result === false) {
                  result = this._iter(new iterresult("after", args));
                  this._cacheAdd("after", result, args);
                }
                return result;
              };
              RRule3.prototype.count = function() {
                return this.all().length;
              };
              RRule3.prototype.toString = function() {
                return optionsToString(this.origOptions);
              };
              RRule3.prototype.toText = function(gettext, language, dateFormatter) {
                return toText(this, gettext, language, dateFormatter);
              };
              RRule3.prototype.isFullyConvertibleToText = function() {
                return isFullyConvertible(this);
              };
              RRule3.prototype.clone = function() {
                return new RRule3(this.origOptions);
              };
              RRule3.FREQUENCIES = [
                "YEARLY",
                "MONTHLY",
                "WEEKLY",
                "DAILY",
                "HOURLY",
                "MINUTELY",
                "SECONDLY"
              ];
              RRule3.YEARLY = Frequency.YEARLY;
              RRule3.MONTHLY = Frequency.MONTHLY;
              RRule3.WEEKLY = Frequency.WEEKLY;
              RRule3.DAILY = Frequency.DAILY;
              RRule3.HOURLY = Frequency.HOURLY;
              RRule3.MINUTELY = Frequency.MINUTELY;
              RRule3.SECONDLY = Frequency.SECONDLY;
              RRule3.MO = Days.MO;
              RRule3.TU = Days.TU;
              RRule3.WE = Days.WE;
              RRule3.TH = Days.TH;
              RRule3.FR = Days.FR;
              RRule3.SA = Days.SA;
              RRule3.SU = Days.SU;
              RRule3.parseString = parseString;
              RRule3.optionsToString = optionsToString;
              return RRule3;
            })()
          );
          ;
          function iterSet(iterResult, _rrule, _exrule, _rdate, _exdate, tzid) {
            var _exdateHash = {};
            var _accept = iterResult.accept;
            function evalExdate(after, before) {
              _exrule.forEach(function(rrule) {
                rrule.between(after, before, true).forEach(function(date) {
                  _exdateHash[Number(date)] = true;
                });
              });
            }
            _exdate.forEach(function(date) {
              var zonedDate2 = new DateWithZone(date, tzid).rezonedDate();
              _exdateHash[Number(zonedDate2)] = true;
            });
            iterResult.accept = function(date) {
              var dt = Number(date);
              if (isNaN(dt))
                return _accept.call(this, date);
              if (!_exdateHash[dt]) {
                evalExdate(new Date(dt - 1), new Date(dt + 1));
                if (!_exdateHash[dt]) {
                  _exdateHash[dt] = true;
                  return _accept.call(this, date);
                }
              }
              return true;
            };
            if (iterResult.method === "between") {
              evalExdate(iterResult.args.after, iterResult.args.before);
              iterResult.accept = function(date) {
                var dt = Number(date);
                if (!_exdateHash[dt]) {
                  _exdateHash[dt] = true;
                  return _accept.call(this, date);
                }
                return true;
              };
            }
            for (var i = 0; i < _rdate.length; i++) {
              var zonedDate = new DateWithZone(_rdate[i], tzid).rezonedDate();
              if (!iterResult.accept(new Date(zonedDate.getTime())))
                break;
            }
            _rrule.forEach(function(rrule) {
              iter(iterResult, rrule.options);
            });
            var res = iterResult._result;
            sort(res);
            switch (iterResult.method) {
              case "all":
              case "between":
                return res;
              case "before":
                return res.length && res[res.length - 1] || null;
              case "after":
              default:
                return res.length && res[0] || null;
            }
          }
          ;
          var rrulestr_DEFAULT_OPTIONS = {
            dtstart: null,
            cache: false,
            unfold: false,
            forceset: false,
            compatible: false,
            tzid: null
          };
          function parseInput(s, options) {
            var rrulevals = [];
            var rdatevals = [];
            var exrulevals = [];
            var exdatevals = [];
            var parsedDtstart = parseDtstart(s);
            var dtstart = parsedDtstart.dtstart;
            var tzid = parsedDtstart.tzid;
            var lines = splitIntoLines(s, options.unfold);
            lines.forEach(function(line) {
              var _a;
              if (!line)
                return;
              var _b = breakDownLine(line), name = _b.name, parms = _b.parms, value = _b.value;
              switch (name.toUpperCase()) {
                case "RRULE":
                  if (parms.length) {
                    throw new Error("unsupported RRULE parm: ".concat(parms.join(",")));
                  }
                  rrulevals.push(parseString(line));
                  break;
                case "RDATE":
                  var _c = (_a = /RDATE(?:;TZID=([^:=]+))?/i.exec(line)) !== null && _a !== void 0 ? _a : [], rdateTzid = _c[1];
                  if (rdateTzid && !tzid) {
                    tzid = rdateTzid;
                  }
                  rdatevals = rdatevals.concat(parseRDate(value, parms));
                  break;
                case "EXRULE":
                  if (parms.length) {
                    throw new Error("unsupported EXRULE parm: ".concat(parms.join(",")));
                  }
                  exrulevals.push(parseString(value));
                  break;
                case "EXDATE":
                  exdatevals = exdatevals.concat(parseRDate(value, parms));
                  break;
                case "DTSTART":
                  break;
                default:
                  throw new Error("unsupported property: " + name);
              }
            });
            return {
              dtstart,
              tzid,
              rrulevals,
              rdatevals,
              exrulevals,
              exdatevals
            };
          }
          function buildRule(s, options) {
            var _a = parseInput(s, options), rrulevals = _a.rrulevals, rdatevals = _a.rdatevals, exrulevals = _a.exrulevals, exdatevals = _a.exdatevals, dtstart = _a.dtstart, tzid = _a.tzid;
            var noCache = options.cache === false;
            if (options.compatible) {
              options.forceset = true;
              options.unfold = true;
            }
            if (options.forceset || rrulevals.length > 1 || rdatevals.length || exrulevals.length || exdatevals.length) {
              var rset_1 = new RRuleSet(noCache);
              rset_1.dtstart(dtstart);
              rset_1.tzid(tzid || void 0);
              rrulevals.forEach(function(val2) {
                rset_1.rrule(new RRule2(groomRruleOptions(val2, dtstart, tzid), noCache));
              });
              rdatevals.forEach(function(date) {
                rset_1.rdate(date);
              });
              exrulevals.forEach(function(val2) {
                rset_1.exrule(new RRule2(groomRruleOptions(val2, dtstart, tzid), noCache));
              });
              exdatevals.forEach(function(date) {
                rset_1.exdate(date);
              });
              if (options.compatible && options.dtstart)
                rset_1.rdate(dtstart);
              return rset_1;
            }
            var val = rrulevals[0] || {};
            return new RRule2(groomRruleOptions(val, val.dtstart || options.dtstart || dtstart, val.tzid || options.tzid || tzid), noCache);
          }
          function rrulestr(s, options) {
            if (options === void 0) {
              options = {};
            }
            return buildRule(s, rrulestr_initializeOptions(options));
          }
          function groomRruleOptions(val, dtstart, tzid) {
            return __assign(__assign({}, val), { dtstart, tzid });
          }
          function rrulestr_initializeOptions(options) {
            var invalid = [];
            var keys = Object.keys(options);
            var defaultKeys2 = Object.keys(rrulestr_DEFAULT_OPTIONS);
            keys.forEach(function(key) {
              if (!includes(defaultKeys2, key))
                invalid.push(key);
            });
            if (invalid.length) {
              throw new Error("Invalid options: " + invalid.join(", "));
            }
            return __assign(__assign({}, rrulestr_DEFAULT_OPTIONS), options);
          }
          function extractName(line) {
            if (line.indexOf(":") === -1) {
              return {
                name: "RRULE",
                value: line
              };
            }
            var _a = split(line, ":", 1), name = _a[0], value = _a[1];
            return {
              name,
              value
            };
          }
          function breakDownLine(line) {
            var _a = extractName(line), name = _a.name, value = _a.value;
            var parms = name.split(";");
            if (!parms)
              throw new Error("empty property name");
            return {
              name: parms[0].toUpperCase(),
              parms: parms.slice(1),
              value
            };
          }
          function splitIntoLines(s, unfold) {
            if (unfold === void 0) {
              unfold = false;
            }
            s = s && s.trim();
            if (!s)
              throw new Error("Invalid empty string");
            if (!unfold) {
              return s.split(/\s/);
            }
            var lines = s.split("\n");
            var i = 0;
            while (i < lines.length) {
              var line = lines[i] = lines[i].replace(/\s+$/g, "");
              if (!line) {
                lines.splice(i, 1);
              } else if (i > 0 && line[0] === " ") {
                lines[i - 1] += line.slice(1);
                lines.splice(i, 1);
              } else {
                i += 1;
              }
            }
            return lines;
          }
          function validateDateParm(parms) {
            parms.forEach(function(parm) {
              if (!/(VALUE=DATE(-TIME)?)|(TZID=)/.test(parm)) {
                throw new Error("unsupported RDATE/EXDATE parm: " + parm);
              }
            });
          }
          function parseRDate(rdateval, parms) {
            validateDateParm(parms);
            return rdateval.split(",").map(function(datestr) {
              return untilStringToDate(datestr);
            });
          }
          ;
          function createGetterSetter(fieldName) {
            var _this = this;
            return function(field) {
              if (field !== void 0) {
                _this["_".concat(fieldName)] = field;
              }
              if (_this["_".concat(fieldName)] !== void 0) {
                return _this["_".concat(fieldName)];
              }
              for (var i = 0; i < _this._rrule.length; i++) {
                var field_1 = _this._rrule[i].origOptions[fieldName];
                if (field_1) {
                  return field_1;
                }
              }
            };
          }
          var RRuleSet = (
            /** @class */
            (function(_super) {
              __extends(RRuleSet2, _super);
              function RRuleSet2(noCache) {
                if (noCache === void 0) {
                  noCache = false;
                }
                var _this = _super.call(this, {}, noCache) || this;
                _this.dtstart = createGetterSetter.apply(_this, ["dtstart"]);
                _this.tzid = createGetterSetter.apply(_this, ["tzid"]);
                _this._rrule = [];
                _this._rdate = [];
                _this._exrule = [];
                _this._exdate = [];
                return _this;
              }
              RRuleSet2.prototype._iter = function(iterResult) {
                return iterSet(iterResult, this._rrule, this._exrule, this._rdate, this._exdate, this.tzid());
              };
              RRuleSet2.prototype.rrule = function(rrule) {
                _addRule(rrule, this._rrule);
              };
              RRuleSet2.prototype.exrule = function(rrule) {
                _addRule(rrule, this._exrule);
              };
              RRuleSet2.prototype.rdate = function(date) {
                _addDate(date, this._rdate);
              };
              RRuleSet2.prototype.exdate = function(date) {
                _addDate(date, this._exdate);
              };
              RRuleSet2.prototype.rrules = function() {
                return this._rrule.map(function(e) {
                  return rrulestr(e.toString());
                });
              };
              RRuleSet2.prototype.exrules = function() {
                return this._exrule.map(function(e) {
                  return rrulestr(e.toString());
                });
              };
              RRuleSet2.prototype.rdates = function() {
                return this._rdate.map(function(e) {
                  return new Date(e.getTime());
                });
              };
              RRuleSet2.prototype.exdates = function() {
                return this._exdate.map(function(e) {
                  return new Date(e.getTime());
                });
              };
              RRuleSet2.prototype.valueOf = function() {
                var result = [];
                if (!this._rrule.length && this._dtstart) {
                  result = result.concat(optionsToString({ dtstart: this._dtstart }));
                }
                this._rrule.forEach(function(rrule) {
                  result = result.concat(rrule.toString().split("\n"));
                });
                this._exrule.forEach(function(exrule) {
                  result = result.concat(exrule.toString().split("\n").map(function(line) {
                    return line.replace(/^RRULE:/, "EXRULE:");
                  }).filter(function(line) {
                    return !/^DTSTART/.test(line);
                  }));
                });
                if (this._rdate.length) {
                  result.push(rdatesToString("RDATE", this._rdate, this.tzid()));
                }
                if (this._exdate.length) {
                  result.push(rdatesToString("EXDATE", this._exdate, this.tzid()));
                }
                return result;
              };
              RRuleSet2.prototype.toString = function() {
                return this.valueOf().join("\n");
              };
              RRuleSet2.prototype.clone = function() {
                var rrs = new RRuleSet2(!!this._cache);
                this._rrule.forEach(function(rule) {
                  return rrs.rrule(rule.clone());
                });
                this._exrule.forEach(function(rule) {
                  return rrs.exrule(rule.clone());
                });
                this._rdate.forEach(function(date) {
                  return rrs.rdate(new Date(date.getTime()));
                });
                this._exdate.forEach(function(date) {
                  return rrs.exdate(new Date(date.getTime()));
                });
                return rrs;
              };
              return RRuleSet2;
            })(RRule2)
          );
          function _addRule(rrule, collection) {
            if (!(rrule instanceof RRule2)) {
              throw new TypeError(String(rrule) + " is not RRule instance");
            }
            if (!includes(collection.map(String), String(rrule))) {
              collection.push(rrule);
            }
          }
          function _addDate(date, collection) {
            if (!(date instanceof Date)) {
              throw new TypeError(String(date) + " is not Date instance");
            }
            if (!includes(collection.map(Number), Number(date))) {
              collection.push(date);
              sort(collection);
            }
          }
          function rdatesToString(param, rdates, tzid) {
            var isUTC = !tzid || tzid.toUpperCase() === "UTC";
            var header = isUTC ? "".concat(param, ":") : "".concat(param, ";TZID=").concat(tzid, ":");
            var dateString = rdates.map(function(rdate) {
              return timeToUntilString(rdate.valueOf(), isUTC);
            }).join(",");
            return "".concat(header).concat(dateString);
          }
          ;
          return __webpack_exports__;
        })()
      );
    });
  }
});

// notify/main.ts
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import webpush from "web-push";

// src/types/data.ts
var COLLECTIONS = [
  "persons",
  "rooms",
  "tasks",
  "occurrences",
  "events",
  "shoppingLists",
  "shoppingItems",
  "devices"
];

// src/lib/merge.ts
function normalizeData(raw) {
  const out = { ...raw, schemaVersion: raw.schemaVersion ?? 1 };
  for (const key of COLLECTIONS) {
    if (!Array.isArray(out[key])) out[key] = [];
  }
  return out;
}
function serializeData(data) {
  return JSON.stringify(data, null, 2) + "\n";
}

// src/lib/dates.ts
var TIME_ZONE = "Europe/Berlin";
var dateFmt = new Intl.DateTimeFormat("de-DE", {
  timeZone: TIME_ZONE,
  day: "2-digit",
  month: "2-digit",
  year: "numeric"
});
var timeFmt = new Intl.DateTimeFormat("de-DE", {
  timeZone: TIME_ZONE,
  hour: "2-digit",
  minute: "2-digit"
});
var longFmt = new Intl.DateTimeFormat("de-DE", {
  timeZone: TIME_ZONE,
  weekday: "long",
  day: "numeric",
  month: "long"
});
var WEEKDAYS_SHORT = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];
function parseYmd(date) {
  const [y, m, d] = date.slice(0, 10).split("-").map(Number);
  return [y, m, d];
}
function addDays(date, n) {
  const [y, m, d] = parseYmd(date);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}
function weekdayShort(date) {
  const [y, m, d] = parseYmd(date);
  return WEEKDAYS_SHORT[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
}
function formatDay(date, today = berlinDateString()) {
  if (date === today) return "Heute";
  if (date === addDays(today, 1)) return "Morgen";
  if (date === addDays(today, -1)) return "Gestern";
  const [y, m, d] = parseYmd(date);
  const base = `${weekdayShort(date)}, ${String(d).padStart(2, "0")}.${String(m).padStart(2, "0")}.`;
  return y === parseYmd(today)[0] ? base : `${base}${y}`;
}
function berlinDateString(d = /* @__PURE__ */ new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(d);
  const get = (t) => parts.find((p) => p.type === t)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

// src/lib/recurrence.ts
var import_rrule = __toESM(require_rrule(), 1);
var pad = (n) => String(n).padStart(2, "0");
function ymd(date) {
  const [y, m, d] = date.slice(0, 10).split("-").map(Number);
  return [y, m, d];
}
function shiftDate(date, days) {
  const [y, m, d] = ymd(date);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}
function toFloating(startAt) {
  const [y, m, d] = ymd(startAt);
  const [h, mi] = startAt.length >= 16 ? startAt.slice(11, 16).split(":").map(Number) : [0, 0];
  return new Date(Date.UTC(y, m - 1, d, h, mi));
}
function floatingDate(d) {
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}
function timeOf(startAt, allDay) {
  if (!startAt || allDay || startAt.length < 16) return null;
  return startAt.slice(11, 16);
}
function withTime(date, time) {
  return time ? `${date}T${time}` : date;
}
function isSeries(t) {
  return !!t.recurrenceRule && !!t.startAt;
}
var ruleCache = /* @__PURE__ */ new Map();
function rruleOf(t) {
  const key = `${t.startAt}|${t.recurrenceRule}`;
  let r = ruleCache.get(key);
  if (!r) {
    const opts = import_rrule.RRule.parseString(t.recurrenceRule.replace(/^RRULE:/i, ""));
    r = new import_rrule.RRule({ ...opts, dtstart: toFloating(t.startAt) });
    if (ruleCache.size > 500) ruleCache.clear();
    ruleCache.set(key, r);
  }
  return r;
}
var dayStart = (date) => toFloating(date);
var dayEnd = (date) => new Date(toFloating(date).getTime() + 864e5 - 1);
function datesBetween(t, from, to, limit = 1e3) {
  if (!isSeries(t) || from > to) return [];
  const out = [];
  rruleOf(t).between(dayStart(from), dayEnd(to), true, (d) => {
    out.push(floatingDate(d));
    return out.length < limit;
  });
  return out;
}
function isRuleDate(t, date) {
  return datesBetween(t, date, date, 1).length === 1;
}
function instanceIndex(t, date) {
  if (!isSeries(t)) return 0;
  const start = t.startAt.slice(0, 10);
  if (date <= start) return 0;
  return rruleOf(t).between(dayStart(start), new Date(dayStart(date).getTime() - 1), true).length;
}
function occurrenceMap(occurrences, taskId) {
  const map = /* @__PURE__ */ new Map();
  for (const o of occurrences) if (o.taskId === taskId && !o.deleted) map.set(o.originalDate, o);
  return map;
}
function assigneesFor(t, occs, date, index) {
  const occ = occs.get(date);
  if (occ?.assigneeId) return [occ.assigneeId];
  if (!t.rotation || t.assigneeIds.length < 2) return t.assigneeIds;
  const n = t.assigneeIds.length;
  let i;
  if (t.recurrenceMode === "after_completion") {
    i = [...occs.values()].filter((o) => o.status === "done" && o.originalDate < date).length;
  } else {
    i = index ?? instanceIndex(t, date);
  }
  return [t.assigneeIds[i % n]];
}
function makeInstance(t, occs, date, index) {
  const occ = occs.get(date);
  if (occ?.status === "skipped") return null;
  const time = timeOf(t.startAt, t.allDay);
  const startAt = occ?.movedTo ?? withTime(date, time);
  return {
    date,
    startAt,
    allDay: startAt.length < 16,
    status: occ?.status === "done" ? "done" : "open",
    completedAt: occ?.status === "done" ? occ.completedAt : null,
    completedBy: occ?.status === "done" ? occ.completedBy : null,
    assigneeIds: assigneesFor(t, occs, date, index),
    moved: !!occ?.movedTo
  };
}
function instanceAt(t, occurrences, date) {
  if (!isSeries(t)) return null;
  const occs = occurrenceMap(occurrences, t.id);
  if (t.recurrenceMode === "after_completion") {
    const occ = occs.get(date);
    if (occ?.status === "done") return makeInstance(t, occs, date);
    if (t.startAt.slice(0, 10) === date) return currentAfterCompletion(t, occs);
    return null;
  }
  if (!isRuleDate(t, date) && !occs.has(date)) return null;
  return makeInstance(t, occs, date);
}
function currentAfterCompletion(t, occs) {
  const date = t.startAt.slice(0, 10);
  return {
    date,
    startAt: t.allDay ? date : t.startAt,
    allDay: t.allDay || t.startAt.length < 16,
    status: "open",
    completedAt: null,
    completedBy: null,
    assigneeIds: assigneesFor(t, occs, date),
    moved: false
  };
}
var effDate = (i) => i.startAt.slice(0, 10);
function expandRange(t, occurrences, from, to) {
  if (!isSeries(t)) return [];
  const occs = occurrenceMap(occurrences, t.id);
  const inRange = (i) => effDate(i) >= from && effDate(i) <= to;
  const out = [];
  if (t.recurrenceMode === "after_completion") {
    for (const o of occs.values()) {
      if (o.status !== "done") continue;
      const inst = makeInstance(t, occs, o.originalDate);
      if (inst && inRange(inst)) out.push(inst);
    }
    const cur = currentAfterCompletion(t, occs);
    if (inRange(cur)) out.push(cur);
    return sortInstances(out);
  }
  const dates = datesBetween(t, from, to);
  const base = dates.length ? instanceIndex(t, dates[0]) : 0;
  const seen = /* @__PURE__ */ new Set();
  dates.forEach((date, i) => {
    seen.add(date);
    const inst = makeInstance(t, occs, date, base + i);
    if (inst && inRange(inst)) out.push(inst);
  });
  for (const o of occs.values()) {
    if (!o.movedTo || seen.has(o.originalDate)) continue;
    const inst = makeInstance(t, occs, o.originalDate);
    if (inst && inRange(inst)) out.push(inst);
  }
  return sortInstances(out);
}
function sortInstances(list) {
  return list.sort((a, b) => a.startAt < b.startAt ? -1 : a.startAt > b.startAt ? 1 : 0);
}
function nextOpen(t, occurrences, from) {
  if (!isSeries(t)) return null;
  const occs = occurrenceMap(occurrences, t.id);
  if (t.recurrenceMode === "after_completion") return currentAfterCompletion(t, occs);
  const candidates = [];
  for (const date of datesBetween(t, from, shiftDate(from, 5 * 366), 60)) {
    const inst = makeInstance(t, occs, date);
    if (inst && inst.status === "open" && effDate(inst) >= from) {
      candidates.push(inst);
      break;
    }
  }
  for (const o of occs.values()) {
    if (!o.movedTo || o.status !== "open" || o.movedTo.slice(0, 10) < from) continue;
    const inst = makeInstance(t, occs, o.originalDate);
    if (inst) candidates.push(inst);
  }
  return sortInstances(candidates)[0] ?? null;
}
function overdueInstance(t, occurrences, today) {
  if (!isSeries(t)) return null;
  const occs = occurrenceMap(occurrences, t.id);
  if (t.recurrenceMode === "after_completion") {
    const cur = currentAfterCompletion(t, occs);
    return effDate(cur) < today ? cur : null;
  }
  const start = t.startAt.slice(0, 10);
  if (start >= today) return null;
  const yesterday = shiftDate(today, -1);
  const candidates = [];
  const last = rruleOf(t).before(dayStart(today), false);
  if (last) {
    const inst = makeInstance(t, occs, floatingDate(last));
    if (inst && effDate(inst) <= yesterday) candidates.push(inst);
  }
  for (const o of occs.values()) {
    if (!o.movedTo || o.movedTo.slice(0, 10) > yesterday) continue;
    const inst = makeInstance(t, occs, o.originalDate);
    if (inst) candidates.push(inst);
  }
  const latest = sortInstances(candidates).at(-1);
  return latest && latest.status === "open" ? latest : null;
}

// src/lib/events.ts
var DEFAULT_EVENT_MIN = 60;
var pad2 = (n) => String(n).padStart(2, "0");
function toUtc(s) {
  const [date, time = "00:00"] = s.split("T");
  const [y, m, d] = date.split("-").map(Number);
  const [h, min] = time.split(":").map(Number);
  return Date.UTC(y, m - 1, d, h, min);
}
function fromUtc(ms, withTime2) {
  const d = new Date(ms);
  const date = `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`;
  return withTime2 ? `${date}T${pad2(d.getUTCHours())}:${pad2(d.getUTCMinutes())}` : date;
}
function addMinutesTo(startAt, minutes) {
  return fromUtc(toUtc(startAt) + minutes * 6e4, true);
}
function minutesBetween(a, b) {
  return Math.round((toUtc(b) - toUtc(a)) / 6e4);
}
function daysBetween(a, b) {
  return Math.round((toUtc(b.slice(0, 10)) - toUtc(a.slice(0, 10))) / 864e5);
}
var isAllDay = (e) => e.allDay || e.startAt.length < 16;
function eventSpan(e) {
  if (isAllDay(e)) return e.endAt ? Math.max(0, daysBetween(e.startAt, e.endAt)) : 0;
  if (!e.endAt || e.endAt.length < 16) return DEFAULT_EVENT_MIN;
  return Math.max(5, minutesBetween(e.startAt, e.endAt));
}
function endFor(e, startAt) {
  const span = eventSpan(e);
  return startAt.length < 16 ? addDays(startAt.slice(0, 10), span) : addMinutesTo(startAt, span);
}
function dayRange(i) {
  const first = i.startAt.slice(0, 10);
  if (i.allDay) return [first, i.endAt.slice(0, 10)];
  let last = i.endAt.slice(0, 10);
  if (i.endAt.slice(11) === "00:00" && last > first) last = addDays(last, -1);
  return [first, last < first ? first : last];
}
function asSeries(e) {
  return {
    id: e.id,
    startAt: e.startAt,
    allDay: isAllDay(e),
    recurrenceRule: e.recurrenceRule,
    recurrenceMode: "fixed",
    rotation: false,
    assigneeIds: e.personIds
  };
}
function exceptionOccs(e) {
  return (e.exceptions ?? []).map((x) => ({
    id: `${e.id}:${x.date}`,
    updatedAt: e.updatedAt,
    deleted: false,
    createdBy: null,
    updatedBy: null,
    taskId: e.id,
    originalDate: x.date,
    movedTo: x.movedTo,
    status: x.skipped ? "skipped" : "open",
    completedAt: null,
    completedBy: null,
    assigneeId: null
  }));
}
function single(e) {
  const allDay = isAllDay(e);
  const startAt = allDay ? e.startAt.slice(0, 10) : e.startAt;
  return { event: e, date: null, startAt, endAt: endFor(e, startAt), allDay, moved: false };
}
function eventInstances(e, from, to) {
  if (e.deleted || !e.startAt) return [];
  const overlaps = (i) => {
    const [a, b] = dayRange(i);
    return a <= to && b >= from;
  };
  if (!isSeries(e)) {
    const i = single(e);
    return overlaps(i) ? [i] : [];
  }
  const reach = isAllDay(e) ? eventSpan(e) : Math.ceil(eventSpan(e) / 1440);
  return expandRange(asSeries(e), exceptionOccs(e), addDays(from, -reach), to).map((inst) => ({
    event: e,
    date: inst.date,
    startAt: inst.startAt,
    endAt: endFor(e, inst.startAt),
    allDay: inst.allDay,
    moved: inst.moved
  })).filter(overlaps);
}
function eventsBetween(events, from, to) {
  const out = [];
  for (const e of events) out.push(...eventInstances(e, from, to));
  return out.sort(compareInstances);
}
function compareInstances(a, b) {
  const da = a.startAt.slice(0, 10);
  const db = b.startAt.slice(0, 10);
  if (da !== db) return da < db ? -1 : 1;
  if (a.allDay !== b.allDay) return a.allDay ? -1 : 1;
  return a.startAt < b.startAt ? -1 : a.startAt > b.startAt ? 1 : 0;
}
function involves(e, personId) {
  return e.personIds.length === 0 || !!personId && e.personIds.includes(personId);
}

// src/notify/time.ts
var fmt = new Intl.DateTimeFormat("en-CA", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23"
});
function berlinParts(d) {
  const p = Object.fromEntries(fmt.formatToParts(d).map((x) => [x.type, x.value]));
  return { date: `${p.year}-${p.month}-${p.day}`, time: `${p.hour}:${p.minute}` };
}
function offsetAt(ms) {
  const { date, time } = berlinParts(new Date(ms));
  const [y, m, d] = date.split("-").map(Number);
  const [h, mi] = time.split(":").map(Number);
  return Date.UTC(y, m - 1, d, h, mi) - Math.floor(ms / 6e4) * 6e4;
}
function berlinWallToDate(wall) {
  const [y, m, d] = wall.slice(0, 10).split("-").map(Number);
  const [h, mi] = wall.length >= 16 ? wall.slice(11, 16).split(":").map(Number) : [0, 0];
  const asUtc = Date.UTC(y, m - 1, d, h, mi);
  const first = asUtc - offsetAt(asUtc);
  return new Date(asUtc - offsetAt(first));
}
function minutesOf(time) {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + (m || 0);
}
function inQuietHours(time, quiet) {
  if (!quiet || quiet.from === quiet.to) return false;
  const t = minutesOf(time);
  const from = minutesOf(quiet.from);
  const to = minutesOf(quiet.to);
  return from < to ? t >= from && t < to : t >= from || t < to;
}

// src/notify/common.ts
function isQuiet(device, now) {
  return inQuietHours(berlinParts(now).time, device.notify.quietHours);
}
function expireDevices(data, ids, nowIso) {
  if (ids.length === 0) return data;
  const set = new Set(ids);
  return {
    ...data,
    devices: data.devices.map(
      (d) => set.has(d.id) ? { ...d, deleted: true, pushSubscription: null, updatedAt: nowIso, updatedBy: null } : d
    )
  };
}
function activeDevices(data) {
  return data.devices.filter((d) => !d.deleted && d.pushSubscription?.endpoint);
}
function personName(data, id) {
  return data.persons.find((p) => p.id === id)?.name ?? "Jemand";
}
function taskUrl(taskId, date) {
  return date ? `#/aufgaben/${taskId}?datum=${date}` : `#/aufgaben/${taskId}`;
}
function eventUrl(eventId, date) {
  return date ? `#/termine/${eventId}?datum=${date}` : `#/termine/${eventId}`;
}
function slotsBetween(data, from, to) {
  const out = [];
  for (const t of data.tasks) {
    if (t.deleted || !t.startAt) continue;
    if (isSeries(t)) {
      for (const i of expandRange(t, data.occurrences, from, to)) {
        out.push({ task: t, date: i.date, startAt: i.startAt, allDay: i.allDay, status: i.status, assigneeIds: i.assigneeIds });
      }
    } else {
      const day = t.startAt.slice(0, 10);
      if (day >= from && day <= to) {
        out.push({
          task: t,
          date: null,
          startAt: t.startAt,
          allDay: t.allDay || t.startAt.length < 16,
          status: t.status,
          assigneeIds: t.assigneeIds
        });
      }
    }
  }
  return out;
}
function overdueSlots(data, today) {
  const out = [];
  for (const t of data.tasks) {
    if (t.deleted || !t.startAt) continue;
    if (isSeries(t)) {
      const i = overdueInstance(t, data.occurrences, today);
      if (i) out.push({ task: t, date: i.date, startAt: i.startAt, allDay: i.allDay, status: "open", assigneeIds: i.assigneeIds });
    } else if (t.status === "open" && t.startAt.slice(0, 10) < today) {
      out.push({ task: t, date: null, startAt: t.startAt, allDay: t.allDay, status: "open", assigneeIds: t.assigneeIds });
    }
  }
  return out;
}
function currentAssignees(t, occurrences, today) {
  if (!isSeries(t)) return { ids: t.assigneeIds, date: null };
  const i = nextOpen(t, occurrences, today);
  return i ? { ids: i.assigneeIds, date: i.date } : { ids: [], date: null };
}
function relevant(device, roomId, assigneeIds, opts = {}) {
  const n = device.notify;
  if (n.rooms.length > 0 && (!roomId || !n.rooms.includes(roomId))) return false;
  const mine2 = assigneeIds.includes(device.personId);
  if (opts.mineOrUnassigned) return mine2 || !n.onlyMyTasks && assigneeIds.length === 0;
  return !n.onlyMyTasks || mine2;
}
function slotLabel(startAt, allDay, today) {
  const day = formatDay(startAt.slice(0, 10), today);
  return !allDay && startAt.length >= 16 ? `${day} ${startAt.slice(11, 16)}` : day;
}
function listTitles(titles, max = 3) {
  const uniq = [...new Set(titles)];
  if (uniq.length <= max) return uniq.join(", ");
  return `${uniq.slice(0, max).join(", ")} und ${uniq.length - max} weitere`;
}

// src/notify/changes.ts
var WATCHED = ["title", "description", "startAt", "allDay", "durationMin", "roomId", "priority", "recurrenceRule", "recurrenceMode"];
var EVENT_WATCHED = ["title", "location", "startAt", "endAt", "allDay", "personIds", "recurrenceRule", "exceptions"];
function nextEventInstance(e, today) {
  return eventsBetween([e], today, addDays(today, 400))[0] ?? eventsBetween([e], e.startAt.slice(0, 10), e.startAt.slice(0, 10))[0] ?? null;
}
function whenOf(t, occurrences, date, today) {
  if (isSeries(t) && date) {
    const i = instanceAt(t, occurrences, date);
    return i ? slotLabel(i.startAt, i.allDay, today) : void 0;
  }
  return t.startAt ? slotLabel(t.startAt, t.allDay || t.startAt.length < 16, today) : void 0;
}
function instanceAssignees(t, occurrences, date) {
  return instanceAt(t, occurrences, date)?.assigneeIds ?? t.assigneeIds;
}
function detectChanges(prev, next, today) {
  const events = [];
  const prevTasks = new Map(prev.tasks.map((t) => [t.id, t]));
  const prevOccs = new Map(prev.occurrences.map((o) => [o.id, o]));
  const tasks = new Map(next.tasks.map((t) => [t.id, t]));
  function occChangedBy(taskId) {
    let latest = null;
    for (const o of next.occurrences) {
      if (o.taskId !== taskId || prevOccs.get(o.id)?.updatedAt === o.updatedAt) continue;
      if (!latest || o.updatedAt > latest.updatedAt) latest = o;
    }
    return latest?.updatedBy ?? null;
  }
  for (const t of next.tasks) {
    if (t.deleted) continue;
    const p = prevTasks.get(t.id);
    const cur = currentAssignees(t, next.occurrences, today);
    const base = { title: t.title, taskId: t.id, roomId: t.roomId };
    const when = whenOf(t, next.occurrences, cur.date, today);
    if (!p || p.deleted) {
      const by = t.updatedBy ?? t.createdBy;
      events.push({ kind: "newTask", by, ...base, date: cur.date, assigneeIds: cur.ids, when });
      for (const a of cur.ids) {
        events.push({ kind: "assigned", by, ...base, date: cur.date, assigneeIds: cur.ids, assignee: a, when });
      }
      continue;
    }
    const taskChanged = p.updatedAt !== t.updatedAt;
    const before = currentAssignees(p, prev.occurrences, today);
    const added = cur.ids.filter((id) => !before.ids.includes(id));
    if (added.length > 0) {
      const by = taskChanged ? t.updatedBy : occChangedBy(t.id);
      for (const a of added) {
        events.push({ kind: "assigned", by, ...base, date: cur.date, assigneeIds: cur.ids, assignee: a, when });
      }
    }
    if (!taskChanged) continue;
    if (!isSeries(t) && p.status === "open" && t.status === "done") {
      events.push({ kind: "completed", by: t.updatedBy, ...base, date: null, assigneeIds: t.assigneeIds });
    } else if (WATCHED.some((k) => JSON.stringify(p[k]) !== JSON.stringify(t[k]))) {
      events.push({ kind: "changed", by: t.updatedBy, ...base, date: cur.date, assigneeIds: cur.ids, when });
    }
  }
  for (const o of next.occurrences) {
    const t = tasks.get(o.taskId);
    if (o.deleted || !t || t.deleted) continue;
    const po = prevOccs.get(o.id);
    const base = { title: t.title, taskId: t.id, roomId: t.roomId, date: o.originalDate };
    if (o.status === "done" && po?.status !== "done") {
      events.push({
        kind: "completed",
        by: o.completedBy ?? o.updatedBy,
        ...base,
        assigneeIds: instanceAssignees(t, next.occurrences, o.originalDate)
      });
    }
    if (o.status === "open" && o.movedTo && o.movedTo !== (po?.movedTo ?? null)) {
      events.push({
        kind: "changed",
        by: o.updatedBy,
        ...base,
        assigneeIds: instanceAssignees(t, next.occurrences, o.originalDate),
        when: slotLabel(o.movedTo, o.movedTo.length < 16, today)
      });
    }
    if (o.assigneeId && o.assigneeId !== (po?.assigneeId ?? null) && o.status !== "done") {
      events.push({
        kind: "assigned",
        by: o.updatedBy,
        ...base,
        assigneeIds: [o.assigneeId],
        assignee: o.assigneeId,
        when: whenOf(t, next.occurrences, o.originalDate, today)
      });
    }
  }
  const prevEvents = new Map((prev.events ?? []).map((e) => [e.id, e]));
  for (const e of next.events ?? []) {
    if (e.deleted) continue;
    const p = prevEvents.get(e.id);
    const base = { title: e.title, taskId: null, eventId: e.id, roomId: null, assigneeIds: e.personIds };
    const next1 = nextEventInstance(e, today);
    const when = next1 ? slotLabel(next1.startAt, next1.allDay, today) : void 0;
    const date = next1?.date ?? null;
    if (!p || p.deleted) {
      events.push({ kind: "newEvent", by: e.updatedBy ?? e.createdBy, ...base, date, when });
    } else if (p.updatedAt !== e.updatedAt && EVENT_WATCHED.some((k) => JSON.stringify(p[k]) !== JSON.stringify(e[k]))) {
      events.push({ kind: "changedEvent", by: e.updatedBy, ...base, date, when });
    }
  }
  const prevItems = new Map(prev.shoppingItems.map((i) => [i.id, i]));
  for (const i of next.shoppingItems) {
    if (i.deleted || i.checked) continue;
    const pi = prevItems.get(i.id);
    if (!pi || pi.deleted || pi.checked) {
      events.push({ kind: "newShoppingItem", by: i.updatedBy, title: i.name, taskId: null, date: null, roomId: null, assigneeIds: [] });
    }
  }
  return dedupe(events);
}
function dedupe(events) {
  const completed = new Set(events.filter((e) => e.kind === "completed").map((e) => e.taskId));
  const seen = /* @__PURE__ */ new Set();
  return events.filter((e) => {
    if (e.kind === "changed" && completed.has(e.taskId)) return false;
    if (e.kind === "newShoppingItem") return true;
    const key = `${e.kind}|${e.taskId ?? e.eventId}|${e.kind === "completed" ? e.date : ""}|${e.assignee ?? ""}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
function eventsForDevice(device, events) {
  const n = device.notify;
  const me = device.personId;
  const picked = events.filter((e) => {
    if (e.by && e.by === me) return false;
    switch (e.kind) {
      case "newShoppingItem":
        return n.newShoppingItem;
      case "assigned":
        return n.assignedToMe && e.assignee === me && relevant(device, e.roomId, [me]);
      case "newTask":
        return n.newTask && relevant(device, e.roomId, e.assigneeIds);
      case "completed":
        return n.completedByOther && relevant(device, e.roomId, e.assigneeIds);
      case "changed":
        return n.changedOrMoved && relevant(device, e.roomId, e.assigneeIds);
      case "newEvent":
      case "changedEvent":
        return (n.newEvent ?? true) && involves({ personIds: e.assigneeIds }, me);
    }
  });
  const assigned = new Set(picked.filter((e) => e.kind === "assigned").map((e) => e.taskId));
  return picked.filter((e) => !(e.kind === "newTask" && assigned.has(e.taskId)));
}
var PLURAL = {
  newTask: (n) => n === 1 ? "1 neue Aufgabe" : `${n} neue Aufgaben`,
  assigned: (n) => `${n} dir zugewiesen`,
  completed: (n) => `${n} erledigt`,
  changed: (n) => `${n} ge\xE4ndert`,
  newShoppingItem: (n) => n === 1 ? "1 Einkaufsartikel" : `${n} Einkaufsartikel`,
  newEvent: (n) => n === 1 ? "1 neuer Termin" : `${n} neue Termine`,
  changedEvent: (n) => n === 1 ? "1 Termin ge\xE4ndert" : `${n} Termine ge\xE4ndert`
};
function targetUrl(e) {
  if (e.taskId) return taskUrl(e.taskId, e.date);
  if (e.eventId) return eventUrl(e.eventId, e.date);
  return null;
}
function composeMessage(events, data) {
  if (events.length === 0) return null;
  const actors = [...new Set(events.map((e) => e.by))];
  const actor = actors.length === 1 ? personName(data, actors[0]) : null;
  const who = actor ?? "Mehrere";
  const kinds = [...new Set(events.map((e) => e.kind))];
  const onlyShopping = kinds.length === 1 && kinds[0] === "newShoppingItem";
  const targets = [...new Set(events.map((e) => e.taskId ?? e.eventId).filter(Boolean))];
  const url = onlyShopping ? "#/einkauf" : targets.length === 1 && kinds.every((k) => k !== "newShoppingItem") ? targetUrl(events.find((e) => e.taskId ?? e.eventId)) ?? "#/" : "#/";
  if (events.length === 1) {
    const e = events[0];
    const withWhen = e.when ? `${e.title} \xB7 ${e.when}` : e.title;
    switch (e.kind) {
      case "newTask":
        return { title: `Neue Aufgabe von ${who}`, body: withWhen, url };
      case "assigned":
        return { title: "Dir zugewiesen", body: withWhen, url };
      case "completed":
        return { title: `${who} hat erledigt`, body: e.title, url };
      case "changed":
        return { title: `${who} hat eine Aufgabe ge\xE4ndert`, body: withWhen, url };
      case "newShoppingItem":
        return { title: "Einkaufszettel", body: `${who} hat ${e.title} hinzugef\xFCgt`, url };
      case "newEvent":
        return { title: `Neuer Termin von ${who}`, body: withWhen, url };
      case "changedEvent":
        return { title: `${who} hat einen Termin ge\xE4ndert`, body: withWhen, url };
    }
  }
  const titles = listTitles(events.map((e) => e.title));
  if (kinds.length === 1) {
    const n = events.length;
    switch (kinds[0]) {
      case "newTask":
        return { title: `${who} hat ${n} neue Aufgaben angelegt`, body: titles, url };
      case "assigned":
        return { title: `${n} Aufgaben sind dir zugewiesen`, body: titles, url };
      case "completed":
        return { title: `${who} hat ${n} Aufgaben erledigt`, body: titles, url };
      case "changed":
        return { title: `${who} hat ${n} Aufgaben ge\xE4ndert`, body: titles, url };
      case "newShoppingItem":
        return { title: `${who} hat ${n} Artikel hinzugef\xFCgt`, body: titles, url };
      case "newEvent":
        return { title: `${who} hat ${n} neue Termine angelegt`, body: titles, url };
      case "changedEvent":
        return { title: `${who} hat ${n} Termine ge\xE4ndert`, body: titles, url };
    }
  }
  const counts = kinds.map((k) => PLURAL[k](events.filter((e) => e.kind === k).length));
  return { title: actor ? `Neues von ${actor}` : "Neues im Organizer", body: counts.join(" \xB7 "), url };
}
function changeMessages(prev, next, today) {
  const events = detectChanges(prev, next, today);
  const out = [];
  for (const device of activeDevices(next)) {
    const payload = composeMessage(eventsForDevice(device, events), next);
    if (payload) out.push({ device, payload });
  }
  return out;
}
function changeRun(prev, next, now) {
  if (!prev) return [];
  const today = berlinParts(now).date;
  const changes = changeMessages(prev, next, today).filter((m) => !isQuiet(m.device, now));
  return [...changes, ...testMessages(prev, next)];
}
function testMessages(prev, next) {
  const before = new Map(prev.devices.map((d) => [d.id, d.testRequestedAt ?? null]));
  return activeDevices(next).filter((d) => d.testRequestedAt && d.testRequestedAt !== before.get(d.id)).map((device) => ({
    device,
    payload: {
      title: "Testbenachrichtigung",
      body: `Push funktioniert auf \u201E${device.name}\u201C.`,
      url: "#/einstellungen/benachrichtigungen",
      tag: "test"
    }
  }));
}

// src/notify/reminders.ts
var emptyState = () => ({ sent: {}, summaries: {} });
var MORNING = "07:00";
var EARLY_MS = 30 * 6e4;
var SUMMARY_WINDOW_MIN = 180;
var mine = (device) => (s) => s.status === "open" && relevant(device, s.task.roomId, s.assigneeIds, { mineOrUnassigned: true });
function reminderKey(device, s) {
  return `r|${device.id}|${s.task.id}|${s.startAt}`;
}
function dueReminder(data, device, now, state) {
  const n = device.notify;
  if (!n.dueReminder) return null;
  const { date: today, time } = berlinParts(now);
  const minutes = minutesOf(time);
  const morning = minutes >= minutesOf(MORNING) && minutes < 12 * 60;
  const nowMs = now.getTime();
  const candidates = [
    ...myEvents(data, device, today, addDays(today, 1)),
    ...slotsBetween(data, today, addDays(today, 1)).filter(mine(device)).map((s) => ({
      kind: "task",
      key: reminderKey(device, s),
      title: s.task.title,
      startAt: s.startAt,
      allDay: s.allDay,
      url: taskUrl(s.task.id, s.date)
    }))
  ];
  const due = [];
  for (const s of candidates) {
    if (state.sent[s.key]) continue;
    const day = s.startAt.slice(0, 10);
    if (s.allDay || n.dueReminderMinutesBefore < 0) {
      const notStarted = s.allDay || berlinWallToDate(s.startAt).getTime() > nowMs;
      if (day === today && morning && notStarted) due.push(s);
    } else {
      const start = berlinWallToDate(s.startAt).getTime();
      const remindAt = start - n.dueReminderMinutesBefore * 6e4;
      if (nowMs >= remindAt - EARLY_MS && nowMs < start) due.push(s);
    }
  }
  if (due.length === 0) return null;
  due.sort((a, b) => a.startAt.localeCompare(b.startAt));
  const keys = due.map((s) => s.key);
  if (due.length === 1) {
    const s = due[0];
    return {
      payload: { title: "Erinnerung", body: `${s.title} \xB7 ${slotLabel(s.startAt, s.allDay, today)}`, url: s.url },
      keys
    };
  }
  const kinds = new Set(due.map((s) => s.kind));
  const what = kinds.size > 1 ? "Eintr\xE4ge" : kinds.has("event") ? "Termine" : "Aufgaben";
  return {
    payload: { title: `Erinnerung: ${due.length} ${what}`, body: listTitles(due.map((s) => s.title), 4), url: "#/" },
    keys
  };
}
function myEvents(data, device, from, to) {
  return eventsBetween(data.events ?? [], from, to).filter((i) => i.startAt.slice(0, 10) >= from && involves(i.event, device.personId)).map((i) => ({
    kind: "event",
    key: `r|${device.id}|ev:${i.event.id}|${i.startAt}`,
    title: i.event.title,
    startAt: i.startAt,
    allDay: i.allDay,
    url: eventUrl(i.event.id, i.date)
  }));
}
function dailySummary(data, device, now, state) {
  const n = device.notify;
  if (!n.dailySummary) return null;
  const { date: today, time } = berlinParts(now);
  if (state.summaries[device.id] === today) return null;
  const t = minutesOf(time);
  const at = minutesOf(n.dailySummaryTime);
  if (t < at || t >= at + SUMMARY_WINDOW_MIN) return null;
  const todays = slotsBetween(data, today, today).filter(mine(device));
  const overdue = overdueSlots(data, today).filter(mine(device));
  const events = eventsBetween(data.events ?? [], today, today).filter((i) => involves(i.event, device.personId));
  if (todays.length === 0 && overdue.length === 0 && events.length === 0) return { payload: null };
  const counts = [];
  if (events.length > 0) counts.push(events.length === 1 ? "1 Termin" : `${events.length} Termine`);
  if (todays.length > 0 || events.length === 0) counts.push(todays.length === 1 ? "1 Aufgabe" : `${todays.length} Aufgaben`);
  const parts = [`Heute: ${counts.join(", ")}`];
  if (overdue.length > 0) parts.push(`${overdue.length} \xFCberf\xE4llig`);
  const titles = listTitles([...events.map((i) => i.event.title), ...[...overdue, ...todays].map((s) => s.task.title)], 4);
  return { payload: { title: "Dein Tag", body: `${parts.join(", ")}
${titles}`, url: "#/", tag: "summary" } };
}
function pruneState(state, now, days = 3) {
  const limit = now.getTime() - days * 864e5;
  const sent = Object.fromEntries(Object.entries(state.sent).filter(([, at]) => Date.parse(at) >= limit));
  return { ...state, sent };
}
function reminderRun(data, state, now) {
  const next = { sent: { ...state.sent }, summaries: { ...state.summaries } };
  const messages = [];
  const today = berlinParts(now).date;
  const at = now.toISOString();
  for (const device of activeDevices(data)) {
    if (isQuiet(device, now)) continue;
    const reminder = dueReminder(data, device, now, next);
    if (reminder) {
      messages.push({ device, payload: reminder.payload });
      for (const k of reminder.keys) next.sent[k] = at;
    }
    const summary = dailySummary(data, device, now, next);
    if (summary) {
      if (summary.payload) messages.push({ device, payload: summary.payload });
      next.summaries[device.id] = today;
    }
  }
  return { messages, state: pruneState(next, now) };
}

// notify/main.ts
var DATA = "data.json";
var STATE = "notify-state.json";
function parseData(text) {
  return normalizeData(JSON.parse(text));
}
function previousData() {
  try {
    const text = execFileSync("git", ["show", `HEAD~1:${DATA}`], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
    return text.trim() ? parseData(text) : null;
  } catch {
    return null;
  }
}
function readState() {
  if (!existsSync(STATE)) return emptyState();
  try {
    return { ...emptyState(), ...JSON.parse(readFileSync(STATE, "utf8")) };
  } catch {
    return emptyState();
  }
}
async function send(messages) {
  const expired = [];
  let ok = 0;
  let failed = 0;
  for (const { device, payload } of messages) {
    try {
      await webpush.sendNotification(device.pushSubscription, JSON.stringify(payload), { TTL: 12 * 3600 });
      ok++;
    } catch (e) {
      const status = e.statusCode;
      if (status === 404 || status === 410) expired.push(device.id);
      else failed++;
      console.log(`Versand an ein Ger\xE4t fehlgeschlagen (HTTP ${status ?? "?"})`);
    }
  }
  console.log(`Gesendet: ${ok}, fehlgeschlagen: ${failed}, abgelaufen: ${expired.length}`);
  return expired;
}
async function main() {
  const mode = process.argv[2];
  if (mode !== "change" && mode !== "reminders") {
    console.error("Aufruf: node scripts/notify.mjs change|reminders");
    process.exit(2);
  }
  const { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT } = process.env;
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY || !VAPID_SUBJECT) {
    console.log("::warning::Push nicht eingerichtet: VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY und VAPID_SUBJECT als Secrets anlegen.");
    return;
  }
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
  if (!existsSync(DATA)) {
    console.log("Keine data.json \u2013 nichts zu tun.");
    return;
  }
  const data = parseData(readFileSync(DATA, "utf8"));
  const now = /* @__PURE__ */ new Date();
  let messages;
  if (mode === "change") {
    messages = changeRun(previousData(), data, now);
  } else {
    const run = reminderRun(data, readState(), now);
    messages = run.messages;
    writeFileSync(STATE, JSON.stringify(run.state, null, 2) + "\n");
  }
  console.log(`Nachrichten: ${messages.length}`);
  const expired = await send(messages);
  if (expired.length > 0) {
    writeFileSync(DATA, serializeData(expireDevices(data, expired, now.toISOString())));
  }
}
main().catch((e) => {
  console.error("Fehler:", e instanceof Error ? e.message : "unbekannt");
  process.exit(1);
});
