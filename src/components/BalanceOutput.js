import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import * as utils from '../utils';

class BalanceOutput extends Component {
  render() {
    if (!this.props.userInput.format) {
      return null;
    }

    return (
      <div className='output'>
        <p>
          Total Debit: {this.props.totalDebit} Total Credit: {this.props.totalCredit}
          <br />
          Balance from account {this.props.userInput.startAccount || '*'}
          {' '}
          to {this.props.userInput.endAccount || '*'}
          {' '}
          from period {utils.dateToString(this.props.userInput.startPeriod)}
          {' '}
          to {utils.dateToString(this.props.userInput.endPeriod)}
        </p>
        {this.props.userInput.format === 'CSV' ? (
          <pre>{utils.toCSV(this.props.balance)}</pre>
        ) : null}
        {this.props.userInput.format === 'HTML' ? (
          <table className="table">
            <thead>
              <tr>
                <th>ACCOUNT</th>
                <th>DESCRIPTION</th>
                <th>DEBIT</th>
                <th>CREDIT</th>
                <th>BALANCE</th>
              </tr>
            </thead>
            <tbody>
              {this.props.balance.map((entry, i) => (
                <tr key={i}>
                  <th scope="row">{entry.ACCOUNT}</th>
                  <td>{entry.DESCRIPTION}</td>
                  <td>{entry.DEBIT}</td>
                  <td>{entry.CREDIT}</td>
                  <td>{entry.BALANCE}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </div>
    );
  }
}

BalanceOutput.propTypes = {
  balance: PropTypes.arrayOf(
    PropTypes.shape({
      ACCOUNT: PropTypes.number.isRequired,
      DESCRIPTION: PropTypes.string.isRequired,
      DEBIT: PropTypes.number.isRequired,
      CREDIT: PropTypes.number.isRequired,
      BALANCE: PropTypes.number.isRequired
    })
  ).isRequired,
  totalCredit: PropTypes.number.isRequired,
  totalDebit: PropTypes.number.isRequired,
  userInput: PropTypes.shape({
    startAccount: PropTypes.number,
    endAccount: PropTypes.number,
    startPeriod: PropTypes.date,
    endPeriod: PropTypes.date,
    format: PropTypes.string
  }).isRequired
};

const resolveAccountRange = (userInput, accounts) => {
  const startAccount = isNaN(userInput.startAccount) ? accounts[0].ACCOUNT : userInput.startAccount;
  const endAccount = isNaN(userInput.endAccount) ? accounts[accounts.length - 1].ACCOUNT : userInput.endAccount;
  return { startAccount, endAccount };
};

const resolvePeriodRange = (userInput, journalEntries) => {
  const startPeriod = isNaN(userInput.startPeriod.valueOf()) ? journalEntries[0].PERIOD : userInput.startPeriod;
  const endPeriod = isNaN(userInput.endPeriod.valueOf()) ? journalEntries[journalEntries.length - 1].PERIOD : userInput.endPeriod;
  return { startPeriod, endPeriod };
};

const filterAccountsByRange = (accounts, startAccount, endAccount) => {
  return accounts.filter(account => 
    account.ACCOUNT >= startAccount && account.ACCOUNT <= endAccount
  );
};

const filterJournalEntriesByPeriod = (journalEntries, startPeriod, endPeriod) => {
  return journalEntries.filter(entry => 
    entry.PERIOD >= startPeriod && entry.PERIOD <= endPeriod
  );
};

const calculateAccountBalance = (account, filteredJournalEntries) => {
  const accountEntries = filteredJournalEntries.filter(entry => 
    entry.ACCOUNT === account.ACCOUNT
  );
  
  const totalDebit = accountEntries.reduce((sum, entry) => sum + entry.DEBIT, 0);
  const totalCredit = accountEntries.reduce((sum, entry) => sum + entry.CREDIT, 0);
  
  const accountBalance = totalDebit - totalCredit;
  
  return {
    ACCOUNT: account.ACCOUNT,
    DESCRIPTION: account.LABEL,
    DEBIT: totalDebit,
    CREDIT: totalCredit,
    BALANCE: accountBalance
  };
};

const calculateTotals = (balance) => {
  const totalCredit = balance.reduce((acc, entry) => acc + entry.CREDIT, 0);
  const totalDebit = balance.reduce((acc, entry) => acc + entry.DEBIT, 0);
  return { totalCredit, totalDebit };
};

const mapStateToProps = (state) => {
  const { accounts, journalEntries, userInput } = state;
  
  if (!accounts.length || !journalEntries.length || !userInput.format) {
    return {
      balance: [],
      totalCredit: 0,
      totalDebit: 0,
      userInput
    };
  }
  
  const { startAccount, endAccount } = resolveAccountRange(userInput, accounts);
  const { startPeriod, endPeriod } = resolvePeriodRange(userInput, journalEntries);
  
  const filteredAccounts = filterAccountsByRange(accounts, startAccount, endAccount);
  const filteredJournalEntries = filterJournalEntriesByPeriod(journalEntries, startPeriod, endPeriod);
  
  const balance = filteredAccounts.map(account => 
    calculateAccountBalance(account, filteredJournalEntries)
  );
  
  const { totalCredit, totalDebit } = calculateTotals(balance);
  
  return {
    balance,
    totalCredit,
    totalDebit,
    userInput
  };
};

export default connect(mapStateToProps)(BalanceOutput);
